"use client";

import { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { DEFAULT_RPC } from "@/lib/utils";
import { PRESET_TOKENS } from "@/lib/constants";
import { WalletResultItem } from "@/components/token-checker/wallet-result-item";
import { TokenPresets } from "@/components/token-checker/token-presets";
import {
  ResultItem,
  TokenListItem,
  TokenMetadata,
  PresetToken,
} from "@/types/token";
import { SocialIcon } from "react-social-icons";
import {
  Button,
  Input,
  ResultSkeleton,
  RPCInput,
  StatsResultSkeleton,
  TokenInput,
  WalletsInput,
} from "@/components";

export default function Home() {
  const [rpc, setRpc] = useState(DEFAULT_RPC);
  const [wallets, setWallets] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [checkSol, setCheckSol] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isWalletsModified, setIsWalletsModified] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingWallets, setLoadingWallets] = useState<string[]>([]);
  const [pendingWallets, setPendingWallets] = useState<string[]>([]);
  const [minValue, setMinValue] = useState("0");
  const [isTokenValue, setIsTokenValue] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedRpc = localStorage.getItem("rpc");
        const savedWallets = localStorage.getItem("wallets");
        if (savedRpc) setRpc(savedRpc);
        if (savedWallets) setWallets(savedWallets);
      } catch (error) {
        console.error("Error loading saved data:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    loadSavedData();
  }, []);

  const handleWalletsChange = (value: string) => {
    setWallets(value);
    setIsWalletsModified(value !== "");
  };

  const saveWallets = () => {
    localStorage.setItem("wallets", wallets);
    setIsWalletsModified(false);
  };

  const fetchTokenMetadata = async (
    tokenAddress: string
  ): Promise<TokenMetadata | null> => {
    try {
      const dexScreenerResponse = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
      );
      const dexData = await dexScreenerResponse.json();
      console.log("DexScreener data:", dexData);

      if (dexData.pairs && dexData.pairs[0]) {
        const pair = dexData.pairs[0];
        return {
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          price: parseFloat(pair.priceUsd || "0"),
        };
      }

      const tokenListResponse = await fetch("https://token.jup.ag/all");
      const tokenList = await tokenListResponse.json();
      const tokenInfo = tokenList.find(
        (token: TokenListItem) => token.address === tokenAddress
      );

      if (tokenInfo) {
        return {
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          price: 0,
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      return null;
    }
  };

  const fetchSolanaPrice = async (): Promise<number> => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      const data = await response.json();
      return data.solana.usd;
    } catch (error) {
      console.error("Error fetching SOL price:", error);
      return 0;
    }
  };

  const checkWallet = async (
    wallet: string,
    connection: Connection
  ): Promise<ResultItem> => {
    try {
      const pubkey = new PublicKey(wallet);
      let balance;
      let tokenMetadata: TokenMetadata | null = null;
      let price = 0;

      if (checkSol) {
        const solBalance = await connection.getBalance(pubkey);
        balance = solBalance / LAMPORTS_PER_SOL;
        price = await fetchSolanaPrice();
        console.log("SOL price:", price);
      } else {
        const tokenMint = new PublicKey(tokenAddress);
        const tokenAccounts = await connection.getTokenAccountsByOwner(pubkey, {
          mint: tokenMint,
        });
        console.log("Token accounts:", tokenAccounts);

        tokenMetadata = await fetchTokenMetadata(tokenAddress);
        console.log("Token metadata in checkWallet:", tokenMetadata);

        if (tokenAccounts.value.length === 0) {
          balance = 0;
        } else {
          const tokenBalance = await connection.getTokenAccountBalance(
            tokenAccounts.value[0].pubkey
          );
          console.log("Token balance data:", tokenBalance);
          balance = tokenBalance.value.uiAmount ?? 0;
        }

        if (tokenMetadata) {
          price = tokenMetadata.price;
        }
      }

      return {
        wallet,
        balance,
        type: checkSol
          ? "SOL"
          : tokenMetadata?.symbol || tokenAddress.slice(0, 4) + "...",
        usdValue: balance * price,
        tokenMetadata: tokenMetadata || undefined,
      };
    } catch (error) {
      console.error("Error in checkWallet:", error);
      return {
        wallet,
        error: "Invalid wallet or error fetching balance",
      };
    }
  };

  const handleRetry = async (walletAddress: string) => {
    setResults((prev) =>
      prev.map((result) =>
        result.wallet === walletAddress
          ? { ...result, isRetrying: true }
          : result
      )
    );

    try {
      const connection = new Connection(rpc);
      const updatedResult = await checkWallet(walletAddress, connection);

      setResults((prev) =>
        prev.map((result) =>
          result.wallet === walletAddress ? { ...updatedResult } : result
        )
      );
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResults([]);

    const walletList = wallets
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((w) => w.trim());

    setLoadingWallets(walletList);
    setPendingWallets(walletList);

    try {
      const connection = new Connection(rpc);

      for (const wallet of walletList) {
        const result = await checkWallet(wallet, connection);
        setResults((prev) => [...prev, result]);
        setPendingWallets((prev) => prev.filter((w) => w !== wallet));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setLoadingWallets([]);
      setPendingWallets([]);
    }
  };

  const calculateStats = (results: ResultItem[]) => {
    const nonZeroBalances = results.filter(
      (r) => !r.error && (r.balance || 0) > 0
    );
    const totalTokens = results.reduce(
      (sum, r) => sum + (r.error ? 0 : r.balance || 0),
      0
    );
    const totalUsd = results.reduce(
      (sum, r) => sum + (r.error ? 0 : r.usdValue || 0),
      0
    );

    return {
      total: results.length,
      nonZero: nonZeroBalances.length,
      totalTokens,
      totalUsd,
    };
  };

  const filteredResults = results.filter((result) => {
    if (result.error) return true;
    const value = isTokenValue ? result.balance || 0 : result.usdValue || 0;
    return value >= parseFloat(minValue || "0");
  });

  const handleTokenSelect = (token: PresetToken) => {
    setTokenAddress(token.address);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url("/background2.webp")' }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="flex items-center justify-between mb-12">
            <h1 className="text-4xl font-bold text-white">
              Solana Token Checker
            </h1>
            <div className="flex items-center gap-4">
              <SocialIcon
                url="https://x.com/akoyrk"
                bgColor="#1DA1F2"
                style={{ height: 35, width: 35 }}
                target="_blank"
                className="hover:scale-110 transition-transform"
              />

              <SocialIcon
                url="https://t.me/+Pt8MwHxgf8QwMGMy"
                network="telegram"
                bgColor="#0088cc"
                style={{ height: 35, width: 35 }}
                target="_blank"
                className="hover:scale-110 transition-transform"
              />

              <SocialIcon
                url="https://github.com/ferbiy/solana-token-checker"
                network="github"
                bgColor="#333"
                style={{ height: 35, width: 35 }}
                target="_blank"
                className="hover:scale-110 transition-transform"
              />
            </div>
          </div>

          <div className="space-y-6 bg-black/40 p-6 rounded-xl backdrop-blur-md">
            <RPCInput
              initialRpc={rpc}
              onRpcChange={setRpc}
              isInitializing={isInitializing}
              loading={loading}
            />

            <WalletsInput
              wallets={wallets}
              onWalletsChange={handleWalletsChange}
              isInitializing={isInitializing}
              loading={loading}
              isWalletsModified={isWalletsModified}
              onSaveWallets={saveWallets}
            />

            <div className="flex items-center gap-4 py-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkSol}
                  onChange={(e) => setCheckSol(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900"
                  disabled={loading}
                />
                <span className="text-white">Check SOL Balance</span>
              </label>
            </div>

            {!checkSol && (
              <>
                <TokenPresets
                  presetTokens={PRESET_TOKENS}
                  selectedAddress={tokenAddress}
                  onSelect={handleTokenSelect}
                />
                <TokenInput
                  tokenAddress={tokenAddress}
                  onTokenAddressChange={setTokenAddress}
                  isInitializing={isInitializing}
                  loading={loading}
                />
              </>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2 text-white">
                  Minimum Value (price in {isTokenValue ? "tokens" : "USD"})
                </label>
                <Input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="0"
                  className="bg-zinc-900/80 border-zinc-700"
                  disabled={loading}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  checked={isTokenValue}
                  onChange={(e) => setIsTokenValue(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900"
                  disabled={loading}
                />
                <span className="text-sm text-white">
                  Filter by token amount
                </span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                loading ||
                !wallets ||
                (!checkSol && !tokenAddress) ||
                isInitializing
              }
              className="w-full bg-zinc-100 text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {isInitializing
                ? "Loading..."
                : loading
                ? "Checking..."
                : "Check Balances"}
            </Button>

            {(results.length > 0 || loadingWallets.length > 0) && (
              <div className="mt-12">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-semibold text-white">Results</h2>
                  {pendingWallets.length > 0 && results.length === 0 ? (
                    <StatsResultSkeleton />
                  ) : (
                    results.length > 0 && (
                      <div className="text-sm text-zinc-300">
                        <div>
                          Balances: {calculateStats(results).nonZero}/
                          {calculateStats(results).total}
                        </div>
                        <div>
                          Total:{" "}
                          {calculateStats(results).totalTokens.toLocaleString()}{" "}
                          {checkSol ? "SOL" : results[0]?.type}
                          {calculateStats(results).totalUsd > 0 && (
                            <span className="ml-1">
                              ($
                              {calculateStats(results).totalUsd.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                              )
                            </span>
                          )}
                        </div>
                        {minValue !== "0" && (
                          <div className="mt-1">
                            Filtered {isTokenValue ? "tokens" : "USD"} ≥{" "}
                            {minValue}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
                <div className="space-y-4">
                  {filteredResults.map((result, index) => (
                    <WalletResultItem
                      key={index}
                      {...result}
                      onRetry={handleRetry}
                      loading={loading}
                    />
                  ))}

                  {pendingWallets.map((wallet) => (
                    <ResultSkeleton key={wallet} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

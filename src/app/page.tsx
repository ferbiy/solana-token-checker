"use client";

import { useState, useEffect } from "react";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_RPC } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { ResultSkeleton } from "@/components/ui/result-skeleton";
import { StatsResultSkeleton } from "@/components/ui/stats-skeleton";

interface TokenMetadata {
  symbol: string;
  name: string;
  price: number;
}

interface ResultItem {
  wallet: string;
  balance?: number;
  type?: string;
  error?: string;
  isRetrying?: boolean;
  usdValue?: number;
  tokenMetadata?: TokenMetadata;
}

interface TokenListItem {
  address: string;
  symbol: string;
  name: string;
}

export default function Home() {
  const [rpc, setRpc] = useState(DEFAULT_RPC);
  const [wallets, setWallets] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [checkSol, setCheckSol] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRpcModified, setIsRpcModified] = useState(false);
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

  const handleRpcChange = (value: string) => {
    setRpc(value);
    setIsRpcModified(value !== DEFAULT_RPC);
  };

  const saveRpc = () => {
    localStorage.setItem("rpc", rpc);
    setIsRpcModified(false);
  };

  const resetRpc = () => {
    setRpc(DEFAULT_RPC);
    setIsRpcModified(false);
    localStorage.removeItem("rpc");
  };

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
      // Try DexScreener for price and metadata
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

      // Fallback to Jupiter only for metadata if DexScreener fails
      const tokenListResponse = await fetch("https://token.jup.ag/all");
      const tokenList = await tokenListResponse.json();
      const tokenInfo = tokenList.find(
        (token: TokenListItem) => token.address === tokenAddress
      );

      if (tokenInfo) {
        return {
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          price: 0, // No price available
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

      const result = {
        wallet,
        balance,
        type: checkSol
          ? "SOL"
          : tokenMetadata?.symbol || tokenAddress.slice(0, 4) + "...",
        usdValue: balance * price,
        tokenMetadata: tokenMetadata || undefined,
      };
      console.log("Final result for wallet:", result);

      return result;
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

      // Process wallets one by one
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-4xl font-bold mb-12">Solana Token Checker</h1>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-sm font-medium">RPC Endpoint</label>
              <span className="text-xs text-zinc-400">
                Optional - recommended for better performance
              </span>
            </div>
            <div className="flex gap-3">
              {isInitializing ? (
                <Skeleton className="h-9 flex-1" />
              ) : (
                <Input
                  value={rpc}
                  onChange={(e) => handleRpcChange(e.target.value)}
                  placeholder="Enter RPC URL"
                  className="bg-zinc-900 border-zinc-700"
                  disabled={loading}
                />
              )}
              <div className="flex gap-2">
                {isRpcModified && !isInitializing && (
                  <Button
                    onClick={saveRpc}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={loading}
                  >
                    Save
                  </Button>
                )}
                <Button
                  onClick={resetRpc}
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                  disabled={loading || isInitializing}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-2">
              <label className="block text-sm font-medium">
                Wallet Addresses
              </label>
              {isWalletsModified && (
                <Button
                  onClick={saveWallets}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 h-7"
                  disabled={loading}
                >
                  Save Addresses
                </Button>
              )}
            </div>
            {isInitializing ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <Textarea
                value={wallets}
                onChange={(e) => handleWalletsChange(e.target.value)}
                placeholder="Enter wallet addresses (one per line or separated by comma)"
                className="bg-zinc-900 border-zinc-700 h-32"
                disabled={loading}
              />
            )}
          </div>

          <div className="flex items-center gap-4 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={checkSol}
                onChange={(e) => setCheckSol(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900"
                disabled={loading}
              />
              <span>Check SOL Balance</span>
            </label>
          </div>

          {!checkSol && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Token Address
              </label>
              {isInitializing ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <Input
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="Enter token address"
                  className="bg-zinc-900 border-zinc-700"
                  disabled={loading}
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Minimum Value (price in {isTokenValue ? "tokens" : "USD"})
              </label>
              <Input
                type="number"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
                placeholder="0"
                className="bg-zinc-900 border-zinc-700"
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
              <span className="text-sm">Filter by token amount</span>
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
                <h2 className="text-xl font-semibold">Results</h2>
                {pendingWallets.length > 0 && results.length === 0 ? (
                  <StatsResultSkeleton />
                ) : (
                  results.length > 0 && (
                    <div className="text-sm text-zinc-400">
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
                  <div
                    key={index}
                    className="p-4 rounded-lg border border-zinc-700 bg-zinc-900 hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-sm text-zinc-300">
                        {result.wallet}
                      </p>
                      <a
                        href={`https://solscan.io/account/${result.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors p-2 hover:scale-110"
                      >
                        <Image
                          src="/solscan.png"
                          alt="Solscan"
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      </a>
                    </div>
                    {result.error ? (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-red-400 text-sm">{result.error}</p>
                        <Button
                          onClick={() => handleRetry(result.wallet)}
                          size="sm"
                          disabled={result.isRetrying || loading}
                          className="bg-orange-600 hover:bg-orange-700 text-white text-xs py-1"
                        >
                          {result.isRetrying ? "Retrying..." : "Retry"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="text-zinc-100">
                          Balance: {result.balance} {result.type}
                        </p>
                        {result.usdValue !== undefined && result.usdValue > 0 && (
                          <p className="text-sm text-zinc-400">
                            ≈ $
                            {result.usdValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            USD
                          </p>
                        )}
                        {result.tokenMetadata && (
                          <p className="text-xs text-zinc-500">
                            {result.tokenMetadata.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
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
  );
}

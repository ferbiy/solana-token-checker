import { Button } from "@/components/ui/button";
import { TokenMetadata } from "@/types/token";
import Image from "next/image";

interface WalletResultItemProps {
  wallet: string;
  balance?: number;
  type?: string;
  error?: string;
  isRetrying?: boolean;
  usdValue?: number;
  tokenMetadata?: TokenMetadata;
  onRetry: (wallet: string) => void;
  loading: boolean;
}

export function WalletResultItem({
  wallet,
  balance,
  type,
  error,
  isRetrying,
  usdValue,
  tokenMetadata,
  onRetry,
  loading,
}: WalletResultItemProps) {
  return (
    <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900 hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between">
        <p className="font-mono text-sm text-zinc-300">{wallet}</p>
        <a
          href={`https://solscan.io/account/${wallet}`}
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
      {error ? (
        <div className="flex items-center justify-between mt-2">
          <p className="text-red-400 text-sm">{error}</p>
          <Button
            onClick={() => onRetry(wallet)}
            size="sm"
            disabled={isRetrying || loading}
            className="bg-orange-600 hover:bg-orange-700 text-white text-xs py-1"
          >
            {isRetrying ? "Retrying..." : "Retry"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-1 mt-2">
          <p className="text-zinc-100">
            Balance: {balance} {type}
          </p>
          {usdValue !== undefined && usdValue > 0 && (
            <p className="text-sm text-zinc-400">
              ≈ $
              {usdValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USD
            </p>
          )}
          {tokenMetadata && (
            <p className="text-xs text-zinc-500">{tokenMetadata.name}</p>
          )}
        </div>
      )}
    </div>
  );
}

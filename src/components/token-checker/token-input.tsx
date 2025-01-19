import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenInputProps {
  tokenAddress: string;
  onTokenAddressChange: (address: string) => void;
  isInitializing: boolean;
  loading: boolean;
}

export function TokenInput({
  tokenAddress,
  onTokenAddressChange,
  isInitializing,
  loading,
}: TokenInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2 text-white">
        Token Address
      </label>
      {isInitializing ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <Input
          value={tokenAddress}
          onChange={(e) => onTokenAddressChange(e.target.value)}
          placeholder="Enter token address"
          className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
          disabled={loading}
        />
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

interface WalletsInputProps {
  wallets: string;
  onWalletsChange: (wallets: string) => void;
  isInitializing: boolean;
  loading: boolean;
  isWalletsModified: boolean;
  onSaveWallets: () => void;
}

export function WalletsInput({
  wallets,
  onWalletsChange,
  isInitializing,
  loading,
  isWalletsModified,
  onSaveWallets,
}: WalletsInputProps) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="block text-sm font-medium text-white">
          Wallet Addresses
        </label>
        {isWalletsModified && (
          <Button
            onClick={onSaveWallets}
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
          onChange={(e) => onWalletsChange(e.target.value)}
          placeholder="Enter wallet addresses (one per line or separated by comma)"
          className="bg-zinc-900 border-zinc-700 h-32 text-white placeholder:text-zinc-500"
          disabled={loading}
        />
      )}
    </div>
  );
}

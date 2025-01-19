import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_RPC } from "@/lib/utils";

interface RPCInputProps {
  initialRpc: string;
  onRpcChange: (rpc: string) => void;
  isInitializing: boolean;
  loading: boolean;
}

export function RPCInput({
  initialRpc,
  onRpcChange,
  isInitializing,
  loading,
}: RPCInputProps) {
  const [rpc, setRpc] = useState(initialRpc);
  const [isRpcModified, setIsRpcModified] = useState(false);

  const handleRpcChange = (value: string) => {
    setRpc(value);
    setIsRpcModified(value !== DEFAULT_RPC);
    onRpcChange(value);
  };

  const saveRpc = () => {
    localStorage.setItem("rpc", rpc);
    setIsRpcModified(false);
  };

  const resetRpc = () => {
    const newRpc = DEFAULT_RPC;
    setRpc(newRpc);
    setIsRpcModified(false);
    localStorage.removeItem("rpc");
    onRpcChange(newRpc);
  };

  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium">RPC Endpoint</label>
          <a
            href="https://account.getblock.io/sign-in?ref=NjQ0MzgyZTEtMTg5YS01MjBkLWIxOWMtMTUzZWMwYjI0NWEy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors underline"
          >
            Get Free RPC
          </a>
        </div>
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
  );
}

import Image from "next/image";
import { PresetToken } from "@/types/token";

interface TokenPresetsProps {
  presetTokens: PresetToken[];
  selectedAddress: string;
  onSelect: (token: PresetToken) => void;
}

export function TokenPresets({
  presetTokens,
  selectedAddress,
  onSelect,
}: TokenPresetsProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2 text-white">
        Popular Tokens
      </label>
      <div className="flex flex-wrap gap-2">
        {presetTokens.map((token) => (
          <button
            key={token.address}
            onClick={() => onSelect(token)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              selectedAddress === token.address
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300"
            }`}
          >
            <Image
              src={token.logoUrl}
              alt={token.symbol}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="text-sm font-medium">{token.symbol}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

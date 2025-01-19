export interface TokenMetadata {
  symbol: string;
  name: string;
  price: number;
}

export interface TokenListItem {
  address: string;
  symbol: string;
  name: string;
}

export interface ResultItem {
  wallet: string;
  balance?: number;
  type?: string;
  error?: string;
  isRetrying?: boolean;
  usdValue?: number;
  tokenMetadata?: TokenMetadata;
}

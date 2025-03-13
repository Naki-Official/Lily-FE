'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type TokenSymbol = 'BTC' | 'ETH' | 'SOL' | 'DOGE' | 'SHIB' | string;

interface TokenIconProps {
  symbol: TokenSymbol;
  size?: number;
  className?: string;
}

const tokenMap: Record<string, { src: string; color: string }> = {
  BTC: { src: '/images/tokens/bitcoin.svg', color: '#F7931A' },
  ETH: { src: '/images/tokens/ethereum.svg', color: '#627EEA' },
  SOL: { src: '/images/tokens/solana.svg', color: '#00FFA3' },
  DOGE: { src: '/images/tokens/dogecoin.svg', color: '#C3A634' },
  SHIB: { src: '/images/tokens/shiba.svg', color: '#FF3B30' },
  // Add more tokens as needed
  AI16Z: { src: '', color: '#007AFF' },
  PEPE: { src: '', color: '#34C759' },
  KWEEN: { src: '', color: '#34C759' },
  KAIA: { src: '', color: '#FF3B30' },
  TNSR: { src: '', color: '#FF9500' },
  OPUS: { src: '', color: '#5856D6' },
  NAVAL: { src: '', color: '#FF2D55' },
  JARVIS: { src: '', color: '#AF52DE' },
  WAIFU: { src: '', color: '#5AC8FA' },
  WHISP: { src: '', color: '#FFCC00' },
  FXN: { src: '', color: '#8A8A8E' },
  FLOKI: { src: '', color: '#5856D6' },
  BONK: { src: '', color: '#FF2D55' },
};

export function TokenIcon({ symbol, size = 32, className }: TokenIconProps) {
  const token = tokenMap[symbol] || { src: '', color: '#F2F2F7' };
  
  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center",
        className
      )}
      style={{ 
        width: size, 
        height: size,
        backgroundColor: token.src ? 'transparent' : token.color
      }}
    >
      {token.src ? (
        <Image
          src={token.src}
          alt={`${symbol} token`}
          width={size}
          height={size}
          className="rounded-full"
        />
      ) : (
        <span className="font-sf-pro text-white font-bold text-xs">
          {symbol.substring(0, 3)}
        </span>
      )}
    </div>
  );
} 
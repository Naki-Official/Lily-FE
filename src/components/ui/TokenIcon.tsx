'use client';

import Image from 'next/image';

import { tokens } from '@/constant/tokens';

export interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenIcon({ symbol, size = 24, className = '' }: TokenIconProps) {
  const token = tokens[symbol] || { name: symbol, color: '#CBD5E1' };

  if (token.image) {
    return (
      <Image
        src={token.image}
        alt={`${token.name} logo`}
        width={size}
        height={size}
        className={`rounded-full ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: token.color,
      }}
    >
      <span className="text-xs font-medium text-white">
        {symbol.slice(0, 3)}
      </span>
    </div>
  );
} 
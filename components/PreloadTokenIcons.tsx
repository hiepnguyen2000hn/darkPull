'use client';

import { useEffect } from 'react';

/**
 * Preload major token icons from CoinCap CDN
 * This improves performance by loading critical icons early
 */

// Major token symbols (most commonly used)
const MAJOR_TOKENS = [
  'btc',   // Bitcoin
  'eth',   // Ethereum
  'usdc',  // USD Coin
  'usdt',  // Tether
  'bnb',   // Binance Coin
  'sol',   // Solana
];

export function PreloadTokenIcons() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Create preload link elements for major tokens
    const preloadLinks: HTMLLinkElement[] = [];

    MAJOR_TOKENS.forEach((symbol) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = `https://assets.coincap.io/assets/icons/${symbol}@2x.png`;
      link.type = 'image/png';

      document.head.appendChild(link);
      preloadLinks.push(link);
    });

    // Cleanup on unmount
    return () => {
      preloadLinks.forEach((link) => {
        document.head.removeChild(link);
      });
    };
  }, []);

  return null; // This component doesn't render anything
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import Image from "next/image";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  color: string;
}

interface TokenSelectorProps {
  selectedToken: string;
  onSelectToken: (token: string) => void;
  className?: string;
}

const TOKENS: Token[] = [
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "🟠", color: "text-orange-500" },
  { symbol: "ETH", name: "Ethereum", icon: "💎", color: "text-blue-500" },
  { symbol: "USDC", name: "USD Coin", icon: "💵", color: "text-blue-500" },
  { symbol: "USDT", name: "Tether", icon: "💚", color: "text-green-500" },
  { symbol: "BNB", name: "Binance Coin", icon: "🟡", color: "text-yellow-500" },
  { symbol: "SOL", name: "Solana", icon: "🌐", color: "text-purple-500" },
  { symbol: "MATIC", name: "Polygon", icon: "🔮", color: "text-purple-500" },
  { symbol: "AVAX", name: "Avalanche", icon: "🔺", color: "text-red-500" },
  { symbol: "LINK", name: "Chainlink", icon: "🔗", color: "text-blue-500" },
  { symbol: "UNI", name: "Uniswap", icon: "🦄", color: "text-pink-500" },
];

const TokenSelector = ({ selectedToken, onSelectToken, className = "" }: TokenSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selected = TOKENS.find((t) => t.symbol === selectedToken) || TOKENS[0];

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const filteredTokens = TOKENS.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectToken = (token: Token) => {
    onSelectToken(token.symbol);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`px-6 py-3 border border-gray-700 rounded-lg font-medium flex items-center space-x-2 hover:border-gray-600 transition-colors ${className}`}
      >
        <span className={selected.color}>{selected.icon}</span>
        <span>{selected.symbol}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl z-50 border border-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Select Token</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Search */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search token..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {/* Token List */}
              <div className="max-h-96 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent hover:scrollbar-thumb-gray-600">
                {filteredTokens.length > 0 ? (
                  <motion.div layout className="space-y-1">
                    {filteredTokens.map((token) => (
                      <motion.button
                        key={token.symbol}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectToken(token)}
                        className={`w-full flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                          token.symbol === selectedToken
                            ? "bg-white/10 border border-white/20"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <span className="text-3xl">{token.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-sm text-gray-400">{token.name}</div>
                        </div>
                        {token.symbol === selectedToken && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-green-500 rounded-full"
                          />
                        )}
                      </motion.button>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No tokens found
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TokenSelector;

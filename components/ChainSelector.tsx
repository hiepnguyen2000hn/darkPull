"use client";

import { useSwitchChain, useChainId } from "wagmi";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { chainMetadata } from "@/config";
import Image from "next/image";

interface ChainSelectorProps {
    className?: string;
}

const ChainSelector = ({ className = "" }: ChainSelectorProps) => {
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentChain = chainId ? chainMetadata[chainId] : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChainSelect = async (targetChainId: number) => {
        try {
            switchChain({ chainId: targetChainId });
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to switch network:", error);
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
                {currentChain?.imageUrl ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white flex items-center justify-center">
                        <Image
                            src={currentChain.imageUrl}
                            alt={currentChain.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-contain"
                        />
                    </div>
                ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        ?
                    </div>
                )}
                <ChevronDown
                    size={16}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 right-0 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-[9999]">
                    <div className="py-2">
                        <div className="px-4 py-2 text-xs text-gray-400 font-medium uppercase">
                            Select Network
                        </div>
                        {Object.entries(chainMetadata).map(([id, chain]) => {
                            const targetChainId = parseInt(id);
                            const isActive = chainId === targetChainId;

                            return (
                                <button
                                    key={id}
                                    onClick={() => handleChainSelect(targetChainId)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-800 transition-colors ${
                                        isActive ? "bg-gray-800" : ""
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center p-1">
                                        <Image
                                            src={chain.imageUrl}
                                            alt={chain.name}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <span className="text-white text-sm font-medium">
                                        {chain.name}
                                    </span>
                                    {isActive && (
                                        <span className="ml-auto text-green-500 text-xs">●</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChainSelector;

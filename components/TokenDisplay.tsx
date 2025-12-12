"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Copy, Check } from "lucide-react";
import { useState, useEffect } from "react";

const TokenDisplay = () => {
    const { authenticated, getAccessToken } = usePrivy();
    const [token, setToken] = useState<string>("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchToken = async () => {
            if (authenticated) {
                try {
                    const accessToken = await getAccessToken();
                    setToken(accessToken || "");
                } catch (error) {
                    console.error("Error fetching access token:", error);
                }
            }
        };

        fetchToken();
    }, [authenticated, getAccessToken]);

    const shortenToken = (token: string) => {
        if (!token || token.length < 10) return token;
        return `${token.slice(0, 6)}...${token.slice(-6)}`;
    };

    const handleCopy = async () => {
        if (token) {
            try {
                await navigator.clipboard.writeText(token);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (error) {
                console.error("Failed to copy token:", error);
            }
        }
    };

    if (!authenticated || !token) {
        return null;
    }

    return (
        <div className="flex items-center space-x-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg">
            <span className="text-xs text-gray-400 font-mono">
                {shortenToken(token)}
            </span>
            <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Copy token"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                ) : (
                    <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                )}
            </button>
        </div>
    );
};

export default TokenDisplay;
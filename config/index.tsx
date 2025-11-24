import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, arbitrum, polygon, base, optimism } from "@reown/appkit/networks";

// Get projectId from https://cloud.reown.com
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Chain metadata với ảnh
export const chainMetadata: Record<number, { name: string; imageUrl: string; gradient: string }> = {
  1: {
    name: "Ethereum",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    gradient: "from-blue-500 to-blue-600"
  },
  42161: {
    name: "Arbitrum",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
    gradient: "from-blue-400 to-blue-500"
  },
  137: {
    name: "Polygon",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
    gradient: "from-purple-500 to-purple-600"
  },
  8453: {
    name: "Base",
    imageUrl: "https://avatars.githubusercontent.com/u/108554348?s=280&v=4",
    gradient: "from-blue-600 to-blue-700"
  },
  10: {
    name: "Optimism",
    imageUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png",
    gradient: "from-red-500 to-red-600"
  }
};

export const networks = [mainnet, arbitrum, polygon, base, optimism];

// Set up the Wagmi Adapter (Config)
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;

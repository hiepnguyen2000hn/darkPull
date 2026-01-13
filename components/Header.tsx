"use client";
import {useState, useEffect} from 'react';
import ConnectButton from './ConnectButton';
import DepositModal from './DepositModal';
import {getAllTokens} from "@/lib/services";
import {useProof} from '@/hooks/useProof';
import {useUserProfile} from '@/hooks/useUserProfile';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import Image from 'next/image';
import { getAllKeys } from '@/lib/ethers-signer';
interface HeaderProps {
    onToggleSidebar?: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps = {}) => {
    const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
    const pathname = usePathname();

    // ✅ Use initWalletClientSide from useProof hook
    const { initWalletClientSide, isInitializing, initStep } = useProof();
    const { profile } = useUserProfile();

    const fetchTokens = async () => {
        console.log('call token')
        const response = await getAllTokens()
        console.log('Tokens:', response);
    }

    const hdlGenWallet = async() => {
        const keys = getAllKeys()
        console.log(profile, 'profile11111111111111111', keys)
        if(profile && profile.is_initialized && !keys.pk_root) {
            await initWalletClientSide()
        }
        return
    }

    useEffect(() => {
        fetchTokens()
    }, [])


    return (
        <header className="border-b border-gray-800 bg-black">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-8">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
                        <div className="relative">
                            <Image
                                src="/logoZ.jpg"
                                alt="Logo"
                                width={48}
                                height={48}
                                className="rounded-full shadow-lg shadow-blue-500/50 group-hover:shadow-purple-500/70 transition-all duration-300 group-hover:scale-110"
                                priority
                            />
                        </div>
                    </div>

                    <nav className="flex items-center space-x-6">
                        <Link
                            href="/TradingDashboard/btc-usdc"
                            className={`font-medium transition-colors ${
                                pathname?.startsWith('/TradingDashboard')
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Trade
                        </Link>
                        <Link
                            href="/assets"
                            className={`font-medium transition-colors ${
                                pathname?.startsWith('/assets')
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Assets
                        </Link>
                        <Link
                            href="/orders"
                            className={`font-medium transition-colors ${
                                pathname?.startsWith('/orders')
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Orders
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Deposit Button - only show when wallet is initialized */}
                    {profile?.is_initialized && (
                        <button
                            onClick={() => setIsDepositModalOpen(true)}
                            className="px-4 py-2 bg-black border border-white text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                        >
                            Deposit
                        </button>
                    )}

                    <ConnectButton
                        onLoginSuccess={() => {}}
                        onToggleSidebar={onToggleSidebar}
                    />
                    {/*<button onClick={myTest}>*/}
                    {/*    test*/}
                    {/*</button>*/}
                </div>
            </div>

            {/* Deposit Modal */}
            <DepositModal
                isOpen={isDepositModalOpen}
                onClose={() => setIsDepositModalOpen(false)}
            />
        </header>
    );
};

export default Header;

import TradingDashboard from '@/components/TradingDashboard';
import type { Metadata } from 'next';

interface PageProps {
    params: Promise<{
        pair: string;
    }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { pair } = await params;
    const title = pair.toUpperCase().replace('-', '/');
    return {
        title: `${title} Trading`,
    };
}

async function TradingPage({ params }: PageProps) {
    const { pair } = await params;

    return <TradingDashboard pair={pair} />;
}

export default TradingPage;

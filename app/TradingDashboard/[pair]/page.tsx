import TradingDashboard from '@/components/TradingDashboard';

interface PageProps {
    params: Promise<{
        pair: string;
    }>;
}

async function TradingPage({ params }: PageProps) {
    const { pair } = await params;

    return <TradingDashboard pair={pair} />;
}

export default TradingPage;

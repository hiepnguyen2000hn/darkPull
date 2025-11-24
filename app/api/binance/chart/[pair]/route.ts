import { NextRequest, NextResponse } from 'next/server';
import { fetchKlineData } from '@/lib/binance';

/**
 * GET /api/binance/chart/[pair]
 * Fetch chart data for a specific trading pair
 * Path param:
 *   - pair: Trading pair (e.g., 'btc-usdt')
 * Query params:
 *   - interval: Time interval (e.g., '1m', '5m', '15m', '1h', '4h', '1d') - default: '1h'
 *   - limit: Number of data points (max: 1000) - default: 500
 *
 * Example: /api/binance/chart/btc-usdt?interval=1h&limit=100
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pair: string }> }
) {
  try {
    const { pair } = await params;
    const searchParams = request.nextUrl.searchParams;
    const interval = searchParams.get('interval') || '1h';
    const limit = parseInt(searchParams.get('limit') || '500');

    if (!pair) {
      return NextResponse.json(
        { error: 'Trading pair is required' },
        { status: 400 }
      );
    }

    // Validate interval
    const validIntervals = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Valid values: ${validIntervals.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate limit
    if (limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Convert pair format: btc-usdt -> BTCUSDT
    const symbol = pair.toUpperCase().replace('-', '');

    const chartData = await fetchKlineData(symbol, interval, limit);

    return NextResponse.json({
      success: true,
      pair: pair.toLowerCase(),
      symbol,
      interval,
      dataPoints: chartData.length,
      data: chartData,
    });
  } catch (error) {
    console.error('Error in /api/binance/chart/[pair]:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch chart data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { get24hTicker, getCurrentPrice } from '@/lib/binance';

/**
 * GET /api/binance/ticker/[pair]
 * Get 24h ticker data for a trading pair
 * Path param:
 *   - pair: Trading pair (e.g., 'btc-usdt')
 *
 * Example: /api/binance/ticker/btc-usdt
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pair: string }> }
) {
  try {
    const { pair } = await params;

    if (!pair) {
      return NextResponse.json(
        { error: 'Trading pair is required' },
        { status: 400 }
      );
    }

    // Convert pair format: btc-usdt -> BTCUSDT
    const symbol = pair.toUpperCase().replace('-', '');

    const tickerData = await get24hTicker(symbol);

    return NextResponse.json({
      success: true,
      pair: pair.toLowerCase(),
      symbol,
      data: {
        price: parseFloat(tickerData.lastPrice),
        priceChange: parseFloat(tickerData.priceChange),
        priceChangePercent: parseFloat(tickerData.priceChangePercent),
        high24h: parseFloat(tickerData.highPrice),
        low24h: parseFloat(tickerData.lowPrice),
        volume: parseFloat(tickerData.volume),
        quoteVolume: parseFloat(tickerData.quoteVolume),
        openPrice: parseFloat(tickerData.openPrice),
        closePrice: parseFloat(tickerData.lastPrice),
        trades: tickerData.count,
      },
    });
  } catch (error) {
    console.error('Error in /api/binance/ticker/[pair]:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ticker data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

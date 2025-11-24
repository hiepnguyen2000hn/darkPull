// Binance API service for fetching chart data

export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
}

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BINANCE_API_URL = 'https://api.binance.com/api/v3';

/**
 * Fetch kline/candlestick data from Binance
 * @param symbol - Trading pair symbol (e.g., 'BTCUSDT')
 * @param interval - Kline interval (e.g., '1m', '5m', '15m', '1h', '4h', '1d')
 * @param limit - Number of data points to return (default: 500, max: 1000)
 */
export async function fetchKlineData(
  symbol: string,
  interval: string = '1h',
  limit: number = 500
): Promise<ChartData[]> {
  try {
    const params = new URLSearchParams({
      symbol: symbol.toUpperCase().replace('-', ''),
      interval,
      limit: limit.toString(),
    });

    const response = await fetch(`${BINANCE_API_URL}/klines?${params}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data: any[] = await response.json();

    // Transform Binance kline data to our chart format
    return data.map((kline) => ({
      time: kline[0], // Open time
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
    }));
  } catch (error) {
    console.error('Error fetching Binance kline data:', error);
    throw error;
  }
}

/**
 * Get current price for a symbol
 */
export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    const response = await fetch(
      `${BINANCE_API_URL}/ticker/price?symbol=${symbol.toUpperCase().replace('-', '')}`,
      { next: { revalidate: 5 } }
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error('Error fetching current price:', error);
    throw error;
  }
}

/**
 * Get 24h ticker data
 */
export async function get24hTicker(symbol: string) {
  try {
    const response = await fetch(
      `${BINANCE_API_URL}/ticker/24hr?symbol=${symbol.toUpperCase().replace('-', '')}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching 24h ticker:', error);
    throw error;
  }
}

"use client";

import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  reason: string | null;
  createdAt: Date;
}

interface MiniPriceChartProps {
  priceHistory: PriceHistory[];
  currentPrice: number;
  showStats?: boolean;
}

export default function MiniPriceChart({ priceHistory, currentPrice, showStats = true }: MiniPriceChartProps) {
  // Prepare data for sparkline (last 10 changes + current)
  const chartData = priceHistory.slice(-10).map((entry) => ({
    price: entry.newPrice,
    date: entry.createdAt,
  }));

  // Add current price as the latest point
  if (chartData.length > 0) {
    chartData.push({
      price: currentPrice,
      date: new Date(),
    });
  }

  // Calculate trend
  const firstPrice = priceHistory[0]?.oldPrice || currentPrice;
  const priceChange = currentPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(2);
  const isIncrease = priceChange > 0;
  const isDecrease = priceChange < 0;

  // Get last change info
  const lastChange = priceHistory[priceHistory.length - 1];
  const lastChangeDate = lastChange ? new Date(lastChange.createdAt).toLocaleDateString() : null;

  // Determine color based on trend
  const strokeColor = isIncrease ? "#ef4444" : isDecrease ? "#22c55e" : "#6b7280";
  const TrendIcon = isIncrease ? TrendingUp : isDecrease ? TrendingDown : Minus;
  const trendColorClass = isIncrease ? "text-red-500" : isDecrease ? "text-green-500" : "text-gray-500";

  if (priceHistory.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No price history available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mini sparkline chart */}
      <div className="h-12 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TrendIcon className={`h-4 w-4 ${trendColorClass}`} />
            <span className={`font-semibold ${trendColorClass}`}>
              {isIncrease && '+'}
              {priceChangePercent}%
            </span>
            <span className="text-muted-foreground">
              from initial price
            </span>
          </div>
          {lastChangeDate && (
            <span className="text-muted-foreground">
              Last changed: {lastChangeDate}
            </span>
          )}
        </div>
      )}

      {/* Price range info */}
      {showStats && chartData.length > 1 && (
        <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>
            Low: ₱{Math.min(...chartData.map(d => d.price)).toFixed(2)}
          </span>
          <span>
            High: ₱{Math.max(...chartData.map(d => d.price)).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

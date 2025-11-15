"use client";

import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Label, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDate } from "@/lib/utils";
import { format } from 'date-fns';

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
  const chartData = priceHistory.slice(-10).map((entry, index) => ({
    price: Number(entry.newPrice),
    date: entry.createdAt,
    label: format(new Date(entry.createdAt), 'MMM dd'),
    reason: entry.reason || 'No reason',
  }));

  // Add current price as the latest point
  if (chartData.length > 0) {
    chartData.push({
      price: Number(currentPrice),
      date: new Date(),
      label: 'Current',
      reason: 'Current price',
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
  const lastChangeDate = lastChange ? formatDate(lastChange.createdAt) : null;

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
    <div className="space-y-2 bg-white border p-3 rounded-md shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700">Price History</h3>
      {/* Mini chart with labels */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="label" 
              tick={{ fill: '#374151', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fill: '#374151', fontSize: 10 }}
              domain={['auto', 'auto']}
            >
              <Label 
                value="Price (₱)" 
                angle={-90} 
                position="insideLeft" 
                style={{ textAnchor: 'middle', fill: '#374151', fontSize: 11 }}
              />
            </YAxis>
            <Line
              type="monotone"
              dataKey="price"
              stroke={strokeColor}
              strokeWidth={2}
              dot={{ fill: strokeColor, r: 4 }}
              activeDot={false}
              label={(props: any) => {
                const { x, y, value } = props;
                return (
                  <text
                    x={x}
                    y={y - 5}
                    fill="#374151"
                    fontSize={10}
                    textAnchor="middle"
                  >
                    ₱{Number(value).toFixed(2)}
                  </text>
                );
              }}
              isAnimationActive={true}
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
            <span className="text-black">
              from initial price
            </span>
          </div>
          {lastChangeDate && (
            <span className="text-black">
              Last changed: {lastChangeDate}
            </span>
          )}
        </div>
      )}

      {/* Price range info */}
      {showStats && chartData.length > 1 && (
        <div className="flex justify-between text-xs text-black pt-1 border-t">
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

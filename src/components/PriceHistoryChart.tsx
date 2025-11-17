"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface PriceHistoryData {
  id: string;
  oldPrice: number;
  newPrice: number;
  changedBy: string;
  reason: string | null;
  createdAt: Date;
}

interface PriceHistoryChartProps {
  categoryName: string;
  priceHistory: PriceHistoryData[];
  currentPrice: number;
}

export default function PriceHistoryChart({ categoryName, priceHistory, currentPrice }: PriceHistoryChartProps) {
  // Prepare data for chart
  const chartData = priceHistory.map((entry) => ({
    date: format(new Date(entry.createdAt), 'MMM dd, yyyy'),
    fullDate: format(new Date(entry.createdAt), 'PPpp'),
    price: Number(entry.newPrice),
    oldPrice: Number(entry.oldPrice),
    reason: entry.reason || 'No reason provided',
  }));

  // Add current price as the latest point
  if (chartData.length > 0) {
    chartData.push({
      date: 'Current',
      fullDate: format(new Date(), 'PPpp'),
      price: Number(currentPrice),
      oldPrice: chartData[chartData.length - 1]?.price || Number(currentPrice),
      reason: 'Current price',
    });
  }

  // Calculate price change percentage
  const firstPrice = priceHistory[0]?.oldPrice || currentPrice;
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const isIncrease = priceChange > 0;

  return (
    <Card className="w-full ">
      <CardHeader className='mb-5'>
        <CardTitle>Price History: {categoryName}</CardTitle>
        <CardDescription className="text-black">
          Track price changes over time
          {priceHistory.length > 0 && (
            <span className={`ml-2 font-semibold ${isIncrease ? 'text-red-500' : 'text-green-500'}`}>
              {isIncrease ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}% from initial price
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-black">
            No price history available for this product
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart className='bg-white border border-black ' data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  className='text-black'
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  label={{ value: 'Price (₱)', angle: -90, position: 'insideLeft' }}
                  domain={['auto', 'auto']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', r: 5 }}
                  activeDot={false}
                  name="Price (₱)"
                  label={(props: any) => {
                    const { x, y, value } = props;
                    return (
                      <text
                        x={x}
                        y={y - 10}
                        fill="#374151"
                        fontSize={11}
                        fontWeight="600"
                        textAnchor="middle"
                      >
                        ₱{Number(value).toFixed(2)}
                      </text>
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Price History Table */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Price Change Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm rounded-lg bg-white border">
                  <thead className="mx-1 bg-custom-green text-white">
                    <tr className="text-left">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Old Price</th>
                      <th className="pb-2">New Price</th>
                      <th className="pb-2">Change</th>
                      <th className="pb-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry) => {
                      const change = entry.newPrice - entry.oldPrice;
                      const changePercent = ((change / entry.oldPrice) * 100).toFixed(2);
                      return (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="py-2">{format(new Date(entry.createdAt), 'PPp')}</td>
                          <td className="py-2">₱{entry.oldPrice.toFixed(2)}</td>
                          <td className="py-2">₱{entry.newPrice.toFixed(2)}</td>
                          <td className={`py-2 font-semibold ${change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {change > 0 ? '+' : ''}₱{change.toFixed(2)} ({changePercent}%)
                          </td>
                          <td className="py-2 text-black">{entry.reason || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

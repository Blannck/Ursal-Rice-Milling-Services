"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  productName: string;
  priceHistory: PriceHistoryData[];
  currentPrice: number;
}

export default function PriceHistoryChart({ productName, priceHistory, currentPrice }: PriceHistoryChartProps) {
  // Prepare data for chart
  const chartData = priceHistory.map((entry) => ({
    date: format(new Date(entry.createdAt), 'MMM dd, yyyy'),
    fullDate: format(new Date(entry.createdAt), 'PPpp'),
    price: entry.newPrice,
    oldPrice: entry.oldPrice,
    reason: entry.reason || 'No reason provided',
  }));

  // Add current price as the latest point
  if (chartData.length > 0) {
    chartData.push({
      date: 'Current',
      fullDate: format(new Date(), 'PPpp'),
      price: currentPrice,
      oldPrice: chartData[chartData.length - 1]?.price || currentPrice,
      reason: 'Current price',
    });
  }

  // Calculate price change percentage
  const firstPrice = priceHistory[0]?.oldPrice || currentPrice;
  const priceChange = ((currentPrice - firstPrice) / firstPrice) * 100;
  const isIncrease = priceChange > 0;

  return (
    <Card className="w-full">
      <CardHeader className='mb-5'>
        <CardTitle>Price History: {productName}</CardTitle>
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  label={{ value: 'Price (₱)', angle: -90, position: 'insideLeft' }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white  p-4 border rounded shadow-lg">
                          <p className="font-semibold ">{data.fullDate}</p>
                          <p className="text-sm text-black">{data.reason}</p>
                          <p className="mt-2">
                            <span className="font-semibold">Price: </span>
                            <span className="text-black ">₱{data.price.toFixed(2)}</span>
                          </p>
                          {data.oldPrice !== data.price && (
                            <p className="text-sm text-black">
                              Previous: ₱{data.oldPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', r: 5 }}
                  activeDot={{ r: 8 }}
                  name="Price (₱)"
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Price History Table */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Price Change Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
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

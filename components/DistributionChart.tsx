import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartData } from '../types';

interface DistributionChartProps {
  psi: number[][];
}

const DistributionChart: React.FC<DistributionChartProps> = ({ psi }) => {
  const data: ChartData[] = useMemo(() => {
    const values = psi.flat();
    const numBins = 50;
    const minVal = -2.5;
    const maxVal = 2.5;
    const binSize = (maxVal - minVal) / numBins;
    
    const bins: number[] = Array(numBins).fill(0);

    for (const value of values) {
      if (value >= minVal && value < maxVal) {
        const binIndex = Math.floor((value - minVal) / binSize);
        bins[binIndex]++;
      }
    }

    return bins.map((count, index) => ({
      name: (minVal + index * binSize).toFixed(2),
      count,
    }));
  }, [psi]);

  return (
    <div className="w-full h-64 bg-gray-800 p-4 rounded-lg shadow-inner">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="name" tick={{ fill: '#a0aec0' }} />
          <YAxis tick={{ fill: '#a0aec0' }} />
          <Tooltip 
            cursor={{fill: 'rgba(128, 90, 213, 0.1)'}}
            contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }} 
          />
          <ReferenceLine x="-1.00" stroke="cyan" strokeDasharray="3 3" />
          <ReferenceLine x="1.00" stroke="#f87171" strokeDasharray="3 3" />
          <Bar dataKey="count" fill="#805AD5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionChart;
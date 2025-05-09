import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from '@mui/x-charts';

const StockChart = ({ data, ticker }) => {
  const chartData = data.priceHistory.map((item) => ({
    time: new Date(item.lastUpdatedAt).toLocaleTimeString(),
    price: item.price,
  }));

  return (
    <Box sx={{ height: '500px', mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        {ticker} Price History (Last {chartData.length} data points)
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Average Price: ${data.averageStockPrice.toFixed(2)}
      </Typography>
      
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            angle={-45} 
            textAnchor="end" 
            height={60}
            tickMargin={20}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            label={{ value: 'Price ($)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value) => [`$${value}`, 'Price']}
            labelFormatter={(value) => `Time: ${value}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#1976d2"
            activeDot={{ r: 8 }}
            name="Stock Price"
          />
          <Line
            type="monotone"
            dataKey={() => data.averageStockPrice}
            stroke="#dc004e"
            strokeDasharray="5 5"
            name="Average Price"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default StockChart;
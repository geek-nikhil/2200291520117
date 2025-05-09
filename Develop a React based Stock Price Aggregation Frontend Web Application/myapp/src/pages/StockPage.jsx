import React, { useState, useEffect } from 'react';
import { Container, Box, TextField, MenuItem, CircularProgress, Paper, Typography } from '@mui/material';
import StockChart from '../components/StockChart';
import axios from 'axios';

const StockPage = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [minutes, setMinutes] = useState(60);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableStocks, setAvailableStocks] = useState([]);

  useEffect(() => {
    // Fetch available stocks
    const fetchStocks = async () => {
      try {
        const response = await axios.get('http://localhost:3001/stocks');
        setAvailableStocks(response.data);
      } catch (err) {
        console.error('Error fetching stocks:', err);
      }
    };
    fetchStocks();
  }, []);

  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:3001/stocks/${ticker}?minutes=${minutes}&aggregation=average`
        );
        setStockData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch stock data');
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchStockData();
    }
  }, [ticker, minutes]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stock Price Analysis
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            select
            label="Select Stock"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            fullWidth
            variant="outlined"
          >
            {availableStocks.map((stock) => (
              <MenuItem key={stock.ticker} value={stock.ticker}>
                {stock.name} ({stock.ticker})
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Time Frame (minutes)"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            fullWidth
            variant="outlined"
          >
            {[15, 30, 60, 120, 240, 480, 1440].map((min) => (
              <MenuItem key={min} value={min}>
                Last {min} minutes
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ my: 2 }}>
            {error}
          </Typography>
        )}

        {stockData && !loading && (
          <StockChart data={stockData} ticker={ticker} />
        )}
      </Paper>
    </Container>
  );
};

export default StockPage;
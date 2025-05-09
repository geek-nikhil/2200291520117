import React, { useState, useEffect } from 'react';
import { Container, Box, TextField, MenuItem, CircularProgress, Paper, Typography } from '@mui/material';
import CorrelationHeatmap from '../components/CorrelationHeatmap';
import axios from 'axios';

const CorrelationPage = () => {
  const [minutes, setMinutes] = useState(60);
  const [correlationData, setCorrelationData] = useState(null);
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
    const fetchCorrelationData = async () => {
      setLoading(true);
      setError(null);
      try {
        // For demo, we'll just pick the first 5 stocks to create a heatmap
        const selectedStocks = availableStocks.slice(0, 5).map(s => s.ticker);
        
        // Create all possible pairs
        const pairs = [];
        for (let i = 0; i < selectedStocks.length; i++) {
          for (let j = i + 1; j < selectedStocks.length; j++) {
            pairs.push([selectedStocks[i], selectedStocks[j]]);
          }
        }

        // Fetch correlation for all pairs
        const correlationResults = await Promise.all(
          pairs.map(async ([ticker1, ticker2]) => {
            const response = await axios.get(
              `http://localhost:3001/stocks/stockcorrelation?minutes=${minutes}&ticker=${ticker1}&ticker=${ticker2}`
            );
            return {
              ticker1,
              ticker2,
              correlation: response.data.correlation,
              stock1Data: response.data.stocks[ticker1],
              stock2Data: response.data.stocks[ticker2]
            };
          })
        );

        // Format data for heatmap
        const formattedData = {};
        selectedStocks.forEach(ticker => {
          formattedData[ticker] = {};
          selectedStocks.forEach(ticker2 => {
            if (ticker === ticker2) {
              formattedData[ticker][ticker2] = 1; // Diagonal
            } else {
              const found = correlationResults.find(
                r => (r.ticker1 === ticker && r.ticker2 === ticker2) || 
                     (r.ticker1 === ticker2 && r.ticker2 === ticker)
              );
              formattedData[ticker][ticker2] = found ? found.correlation : 0;
            }
          });
        });

        setCorrelationData({
          matrix: formattedData,
          stocks: selectedStocks,
          details: correlationResults
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch correlation data');
        console.error('Error fetching correlation data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (availableStocks.length > 0) {
      fetchCorrelationData();
    }
  }, [minutes, availableStocks]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stock Correlation Heatmap
        </Typography>
        
        <Box sx={{ mb: 3, width: 300 }}>
          <TextField
            select
            fullWidth
            label="Time Frame (minutes)"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
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

        {correlationData && !loading && (
          <CorrelationHeatmap data={correlationData} />
        )}
      </Paper>
    </Container>
  );
};

export default CorrelationPage;
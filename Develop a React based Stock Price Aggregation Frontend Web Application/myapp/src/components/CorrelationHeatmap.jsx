import React from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { HeatMapGrid } from 'react-grid-heatmap';

const CorrelationHeatmap = ({ data }) => {
  const theme = useTheme();
  const { matrix, stocks } = data;

  // Prepare data for heatmap
  const heatmapData = stocks.map(ticker1 => 
    stocks.map(ticker2 => matrix[ticker1][ticker2])
  );

  // Color scale for correlation values
  const getCellColor = (value) => {
    if (value >= 0.7) return '#2e7d32'; // Strong positive
    if (value >= 0.3) return '#689f38'; // Positive
    if (value >= -0.3) return '#9e9e9e'; // Neutral
    if (value >= -0.7) return '#ef6c00'; // Negative
    return '#c62828'; // Strong negative
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Stock Correlation Matrix
      </Typography>
      <Typography variant="body2" gutterBottom>
        Hover over cells to see correlation values
      </Typography>
      
      <Paper elevation={2} sx={{ p: 2, overflow: 'auto' }}>
        <Box sx={{ width: '100%', height: '500px' }}>
          <HeatMapGrid
            data={heatmapData}
            xLabels={stocks}
            yLabels={stocks}
            cellRender={(x, y, value) => (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: getCellColor(value),
                  color: theme.palette.getContrastText(getCellColor(value)),
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
                title={`${stocks[y]} vs ${stocks[x]}: ${value.toFixed(2)}`}
              >
                {value.toFixed(2)}
              </Box>
            )}
            xLabelsStyle={() => ({
              fontSize: '0.75rem',
              textAlign: 'center',
              color: theme.palette.text.primary,
            })}
            yLabelsStyle={() => ({
              fontSize: '0.75rem',
              textAlign: 'right',
              color: theme.palette.text.primary,
              paddingRight: '8px',
            })}
            cellStyle={(_x, _y, ratio) => ({
              background: getCellColor(ratio),
              fontSize: '0.75rem',
              color: theme.palette.getContrastText(getCellColor(ratio)),
            })}
            cellHeight="40px"
            xLabelsPos="bottom"
            onClick={(x, y) => alert(`Correlation between ${stocks[y]} and ${stocks[x]}: ${heatmapData[y][x].toFixed(2)}`)}
          />
        </Box>
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2">Correlation Legend:</Typography>
        {['Strong Positive', 'Positive', 'Neutral', 'Negative', 'Strong Negative'].map((label, i) => {
          const colors = ['#2e7d32', '#689f38', '#9e9e9e', '#ef6c00', '#c62828'];
          return (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: colors[i],
                  mr: 1,
                  border: '1px solid #ddd',
                }}
              />
              <Typography variant="caption">{label}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default CorrelationHeatmap;
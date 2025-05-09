import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Stock Analytics
        </Typography>
        <Button color="inherit" component={Link} to="/stocks">
          Stocks
        </Button>
        <Button color="inherit" component={Link} to="/correlation">
          Correlation
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
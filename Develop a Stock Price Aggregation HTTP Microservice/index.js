const express = require('express');
const app = express();
// const routes = require('./routes');

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Routes
// app.use('/', routes);
app.use("/",async (req, res) => {
  res.send("Hello World!");
});
// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

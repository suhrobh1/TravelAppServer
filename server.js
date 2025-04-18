const express = require('express');
const cors = require('cors'); // For handling Cross-Origin Requests

const app = express();
const port = process.env.PORT || 3001; // Different port than the client (usually 3000 for Vite dev)

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to enable CORS (for development - adjust for production)
app.use(cors());

app.post('/api/get-forecast', (req, res) => {
  const { city } = req.body;
  console.log(`Received city: ${city}`);

  // In a real application, you would:
  // 1. Use the 'city' to fetch forecast data from a weather API or your microservice.
  // 2. Process the data.

  // For this example, we'll just send back a dummy response.
  const dummyForecast = `Forecast data for ${city} will be available soon.`;

  res.json({ message: 'City received successfully!', city: city, forecast: dummyForecast });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
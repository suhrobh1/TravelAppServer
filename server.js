

const express = require('express');
const fetch = require('node-fetch'); // Import the node-fetch library
const cors = require('cors'); // You might need this if your client and server are on different origins

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors()); // Enable CORS if needed

app.post('/api/get-forecast', async (req, res) => {
  const { city } = req.body;
  console.log(`Received city: ${city}`);

  const microserviceUrl =  "https://weatherservice-production.up.railway.app/";//process.env.MICROSERVICE_URL; // Get the Railway URL of your microservice
  const forecastDates = ['2025-04-18', '2025-04-19']; // Example dates to send to the microservice

  if (!microserviceUrl) {
    console.error('MICROSERVICE_URL environment variable not set.');
    return res.status(500).json({ error: 'Microservice URL not configured.' });
  }

  try {
    const microserviceResponse = await fetch(`${microserviceUrl}/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: city, dates: forecastDates }), // Send city and dates to the microservice
    });

    if (!microserviceResponse.ok) {
      const errorData = await microserviceResponse.json();
      console.error('Error from microservice:', errorData);
      return res.status(microserviceResponse.status).json({
        error: `Failed to fetch forecast from microservice: ${microserviceResponse.statusText}`,
        details: errorData,
      });
    }

    const forecastDataFromMicroservice = await microserviceResponse.json();
    console.log('Forecast data from microservice:', forecastDataFromMicroservice);

    // Process the data received from the microservice if needed
    const processedForecast = `Forecast for ${forecastDataFromMicroservice.city}: ${JSON.stringify(forecastDataFromMicroservice.temps)}`;

    res.json({
      message: 'Forecast data retrieved from microservice!',
      city: city,
      forecast: processedForecast,
      microserviceData: forecastDataFromMicroservice, // Optionally send the raw microservice data
    });

  } catch (error) {
    console.error('Error communicating with microservice:', error);
    res.status(500).json({ error: 'Failed to communicate with the forecast microservice.' });
  }
});

app.listen(port, () => {
  console.log(`Main app server listening on port ${port}`);
});

 
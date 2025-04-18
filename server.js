
import fetch from "node-fetch";
import express from "express";
// const fetch = require('node-fetch');
import cors from "cors";



const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());

app.post('/api/get-forecast', async (req, res) => {
  const { city, fromDate, toDate } = req.body;
  console.log(`Received request: city=${city}, fromDate=${fromDate}, toDate=${toDate}`);

  const microserviceUrl = process.env.MICROSERVICE_URL;

  if (!microserviceUrl) {
    console.error('MICROSERVICE_URL environment variable not set.');
    return res.status(500).json({ error: 'Microservice URL not configured.' });
  }

  if (!city || !fromDate || !toDate) {
    return res.status(400).json({ error: 'Missing required parameters: city, fromDate, or toDate.' });
  }

  try {
    const microserviceResponse = await fetch(`${microserviceUrl}/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: city, fromDate: fromDate, toDate: toDate }),
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

    res.json({
      message: 'Forecast data retrieved from microservice!',
      city: city,
      fromDate: fromDate,
      toDate: toDate,
      forecast: `Forecast from ${fromDate} to ${toDate}: ${JSON.stringify(forecastDataFromMicroservice.temps)}`,
      microserviceData: forecastDataFromMicroservice,
    });

  } catch (error) {
    console.error('Error communicating with microservice:', error);
    res.status(500).json({ error: 'Failed to communicate with the forecast microservice.' });
  }
});

app.listen(port, () => {
  console.log(`Main app server listening on port ${port}`);
});
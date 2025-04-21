import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors());


// --- Helper: fetch forecast ---
async function forecastFetch(city, fromDate, toDate) {
  try {
    const response = await fetch(`https://weatherservice-production.up.railway.app/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, fromDate, toDate }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        statusText: response.statusText,
        errorData,
      };
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
}

// --- Helper: fetch places ---
async function fetchPlaces(city) {
  try {
    const response = await fetch(`https://placesofinterest-production.up.railway.app/places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw {
        status: response.status,
        statusText: response.statusText,
        errorData,
      };
    }

    return await response.json();
  } catch (err) {
    throw err;
  }
}

// --- Express route ---
app.post('/api/get-trip', async (req, res) => {
  const { city, fromDate, toDate } = req.body;
  console.log(`Received request: city=${city}, fromDate=${fromDate}, toDate=${toDate}`);

  if (!city || !fromDate || !toDate) {
    return res.status(400).json({ error: 'Missing required parameters: city, fromDate, or toDate.' });
  }

  try {
    const forecastData = await forecastFetch(city, fromDate, toDate);
    const placesData = await fetchPlaces(city);

    

    res.json({
      message: 'Trip data retrieved from microservices!',
      city,
      fromDate,
      toDate,
      forecast: forecastData.temps,
      places: placesData.places || placesData, // fallback if shape isn't wrapped in "places"
      microserviceData: {
        forecast: forecastData,
        places: placesData
      },
    });

  } catch (error) {
    if (error?.status) {
      console.error('Error from microservice:', error.errorData);
      res.status(error.status).json({
        error: `Microservice failed: ${error.statusText}`,
        details: error.errorData,
      });
    } else {
      console.error('Error communicating with microservices:', error);
      res.status(500).json({ error: 'Failed to communicate with microservices.' });
    }
  }
});











app.listen(port, () => {
  console.log(`Main app server listening on port ${port}`);
});
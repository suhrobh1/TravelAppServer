import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import authenticateToken from './middleware/authMiddleware.js';


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;


app.use(express.json());
app.use(cors());




// --- Helper: fetch forecast ---
async function forecastFetch(city, fromDate, toDate, latitude, longitude) {

  try{
    // const response = await fetch(`http://localhost:3003/forecast`, {
    const response = await fetch(`https://weatherservice-production.up.railway.app/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, fromDate, toDate, latitude, longitude }),
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
async function fetchPlaces(city, latitude, longitude) {
  try {
    // const response = await fetch(`http://localhost:3004/places`, {
   const response = await fetch(`https://placesofinterest-production.up.railway.app/places`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, latitude, longitude }),
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

// --- Helper: fetch AI summary ---
async function fetchSummary(city, latitude, longitude) {

  console.log("Inside summary fetch")
  try {
    // const response = await fetch(`http://localhost:3000/summary`, {
    const response = await fetch(`https://citysummary-production.up.railway.app/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, latitude, longitude }),
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

// --- Helper: fetch hotels ---
async function fetchHotels(city, latitude, longitude) {
  try {
    // const response = await fetch(`http://localhost:3004/places`, {
   const response = await fetch(`https://hotels-bcbydtfhekbcg5bg.canadacentral-01.azurewebsites.net/hotels`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city, latitude, longitude }),
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
// app.post('/api/get-trip', async (req, res) => {
//   const { city, fromDate, toDate, latitude, longitude } = req.body;
//   console.log(`Received request: city=${city}, fromDate=${fromDate}, toDate=${toDate}, latitude=${latitude}, longitude=${longitude}`);

//   try {
//     const forecastData = await forecastFetch(city, fromDate, toDate, latitude, longitude);
//     const placesData = await fetchPlaces(city, latitude, longitude);
//     const summaryData = await fetchSummary(city, latitude, longitude);
//     const hotelsData = await fetchHotels(city, latitude,longitude);

//     console.log("SummaryData", summaryData)

//     //travelplan data append to db
//     try {
//       console.log("Tavel data to be saved - FORECAST:", forecastData);
//       console.log("Tavel data to be saved - PLACES:", placesData);
//       console.log("Tavel data to be saved - HOTELS:", hotelsData);
//       console.log("Tavel data to be saved - SUMMARY:", summaryData);

      
//     } catch (err) {
//       console.log("Error in travel data save: ", err)
//       res.status(500).json({ msg: "Error creating travel plan" });
//     }

//     res.json({
//       message: 'Trip data retrieved from microservices and saved to DB !!',
//       city,
//       fromDate,
//       toDate,
//       forecast: forecastData.temps,
//       places: placesData.places || placesData, // fallback if shape isn't wrapped in "places"
//       microserviceData: {
//         forecast: forecastData,
//         places: placesData,
//         summary: summaryData,
//         hotels: hotelsData
//       },
//     });

//   } catch (error) {
//     if (error?.status) {
//       console.error('Error from microservice:', error.errorData);
//       res.status(error.status).json({
//         error: `Microservice failed: ${error.statusText}`,
//         details: error.errorData,
//       });
//     } else {
//       console.error('Error communicating with microservices:', error);
//       res.status(500).json({ error: 'Failed to communicate with microservices.' });
//     }
//   }
// });



app.post('/api/get-trip', async (req, res) => {
  const { city, fromDate, toDate, latitude, longitude } = req.body;
  console.log(`Received request: city=${city}, fromDate=${fromDate}, toDate=${toDate}, latitude=${latitude}, longitude=${longitude}`);

  try {
    const forecastData = await forecastFetch(city, fromDate, toDate, latitude, longitude);
    const placesData = await fetchPlaces(city, latitude, longitude);
    const summaryData = await fetchSummary(city, latitude, longitude);
    const hotelsData = await fetchHotels(city, latitude, longitude);

    console.log("SummaryData", summaryData);

    try {
      console.log("Travel data to be saved - FORECAST:", forecastData);
      console.log("Travel data to be saved - PLACES:", placesData);
      console.log("Travel data to be saved - HOTELS:", hotelsData);
      console.log("Travel data to be saved - SUMMARY:", summaryData);

      await TravelPlan.create({
        weatherForecast: forecastData.forecast || [],
        placesOfInterest: (placesData.places || []).slice(0, 5),
        hotels: (hotelsData.places || []).slice(0, 5),
        summary: [{ summary: summaryData.summary || summaryData }]
      });

    } catch (err) {
      console.error("Error saving travel plan: ", err);
      return res.status(500).json({ msg: "Error creating travel plan" });
    }

    res.json({
      message: 'Trip data retrieved from microservices and saved to DB !!',
      city,
      fromDate,
      toDate,
      forecast: forecastData.forecast,
      places: (placesData.places || []).slice(0, 5),
      hotels: (hotelsData.places || []).slice(0, 5),
      microserviceData: {
        forecast: forecastData,
        places: placesData,
        summary: summaryData,
        hotels: hotelsData
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



// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

//TravelPlan Schemas and Model
const WeatherSchema = new mongoose.Schema({
  time: { type: Date, required: true },
  maxTemperature: { type: Number, required: true },
  minTemperature: { type: Number, required: true },
  precipitationProbability: { type: Number, required: true }, // mm or %
  cloudCover: { type: Number, required: true } // 0-100 (%)
}, { _id: false });

const PlaceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  categories: { type: Array, required: true } // e.g. "museum", "park"
}, { _id: false });

const SummarySchema = new mongoose.Schema({
  summary: { type: String, required: true },
}, { _id: false });


const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  distance: { type: Number, required: true } // e.g., in km or miles
}, { _id: false });

const TravelPlanSchema = new mongoose.Schema({
  summary: {
    type: [SummarySchema],
  },
  weatherForecast: {
    type: [WeatherSchema],
    validate: [arrayLimit(7), 'Max 4 days of forecast'] // current + 3 days
  },
  placesOfInterest: {
    type: [PlaceSchema],
    validate: [arrayLimit(5), 'Max 5 places of interest']
  },
  hotels: {
    type: [HotelSchema],
    validate: [arrayLimit(5), 'Max 5 hotels']
  },
}, { timestamps: true });

// Helper to limit array size
function arrayLimit(max) {
  return function(val) {
    return val.length <= max;
  };
}
const TravelPlan = mongoose.model('TravelPlan', TravelPlanSchema);


// Sign up code
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body.form;

  console.log("Req.body from signup: ", req.body);
  console.log("first name:", firstName );

  try {
    // Check for user
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    // Hashing the password
    const hashed = await bcrypt.hash(password, 10);

    // Creating the user
    await User.create({firstName, lastName, email, password: hashed,  });
    // Stuff back from creation
    res.status(201).json({ msg: "User created" });

  } catch (err) {
    res.status(500).json({ msg: "Error creating user" });
  }
});

// Login code
app.post("/api/auth/login", async (req, res) => {

  console.log("Req.body from signin: ", req.body);
  // console.log("email:", email );

  const { email, password } = req.body.form;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ msg: "Error logging in" });
  }
});

// User update
app.put("/api/auth/user", authenticateToken, async (req, res) => {

  // console.log("inside put!")

  try {
    const { firstName, lastName, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, email },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Getting travel plans from DB
app.get("/api/travel-plans", async (req, res) => {
  try {
    const plans = await TravelPlan.find().sort({ createdAt: -1 }).limit(10);
    res.json(plans);
  } catch (err) {
    console.error("Error fetching travel plans:", err);
    res.status(500).json({ msg: "Failed to retrieve travel plans" });
  }
});



//Server conf
app.listen(port, () => {
  console.log(`Main app server listening on port ${port}`);
});
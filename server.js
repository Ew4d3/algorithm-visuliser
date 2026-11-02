const express = require("express");

// Create our Express application.
const app = express();

//node server.js


// Define the port our server will use.
const PORT = 3000;

// Allow our server to understand JSON.
app.use(express.json());

// Create our first API endpoint.
app.get("/api", (req, res) => {
    res.json({
        message: "Algorithm Visualiser backend is working!"
    });
});

app.post("/api/test", (req, res) => {
    console.log("Frontend sent a request!");

    res.json({
        message: "Hello from the backend!"
    });
});


// Start the server.
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
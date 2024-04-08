// Instantiate and setup Express app
// const gcpMetadata = require('gcp-metadata');
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require('cors');
app.use(cors());
const PORT = process.env.API_PORT;
app.use(express.json());
app.set("json spaces", 4);
app.use(express.static(__dirname + "/public")); 


// Start server
app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT} ...`);
});


// Import and setup middleware
const logger = require("./middleware/logger");
app.use("/api", [logger]);


// Import and setup routes
app.get("/api/health", (req, res) => {
    res.status(200).json({health: "Course Collab files service OK"});
});

//const filesRouter = require('./routes/files');
//app.use("/api/files", filesRouter);



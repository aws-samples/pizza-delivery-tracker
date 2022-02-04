"use strict"

const express = require("express")
var cors = require('cors')

var whereRouter = require('./routes/where');
var routeRouter = require('./routes/route');

// App
const app = express()

// Enabeling cors and preflight for every route - for local dev
app.use(cors());
app.options('*', cors())

// Basic endpoint and healtcheck
app.get("/", (req, res) => {
  res.send("Hello World from the backend")
})

// Business logic endpoints
app.use('/where_is_my_pizza', whereRouter);
app.use('/route_to_my_pizza', routeRouter);

const port = process.env.PORT || 8080
app.listen(port)
console.log(`Listening on port ${port}.`)

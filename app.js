'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');

//load routes
const indexRoutes = require('./routes/');
const apiRoutes = require('./routes/api');


// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app 
const app = express();

// setup morgan which gives us http request logging
app.use(morgan('dev'));


// setup a friendly greeting for the root route: moved to toutes folder
app.use('/', indexRoutes);

// api routes
app.use('/api', apiRoutes);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port: moved to ./bin/www
// start listening on our port: moved to ./bin/www


module.exports = app;
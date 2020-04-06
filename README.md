
# Full Stack JavaScript Techdegree v2 - REST API Project

## Overview of the Provided Project Files

We've supplied the following files for you to use: 

* The `seed` folder contains a starting set of data for your database in the form of a JSON file (`data.json`) and a collection of files (`context.js`, `database.js`, and `index.js`) that can be used to create your app's database and populate it with data (we'll explain how to do that below).
* We've included a `.gitignore` file to ensure that the `node_modules` folder doesn't get pushed to your GitHub repo.
* The `app.js` file configures Express to serve a simple REST API. We've also configured the `morgan` npm package to log HTTP requests/responses to the console. You'll update this file with the routes for the API. You'll update this file with the routes for the API.
* The `nodemon.js` file configures the nodemon Node.js module, which we are using to run your REST API.
* The `package.json` file (and the associated `package-lock.json` file) contain the project's npm configuration, which includes the project's dependencies.
* The `RESTAPI.postman_collection.json` file is a collection of Postman requests that you can use to test and explore your REST API.

## Getting Started with the review

To get up and running with this project, run the following commands from the root of the folder that contains this README file.

First, install the project's dependencies using `npm`.

```
npm install

```

Second, seed the SQLite database.

```
npm run seed
```

And lastly, start the application.

```
npm start
```

To test the Express server, browse to the URL [http://localhost:5000/](http://localhost:5000/).

# Project comments

## app.js file
To keep things organized and to stay close the the default express setup:
* Moved all routes to the route a route folder split in index and api routes
* Moved set port to ./bin/www
* Moved start listening on port to ./bin/www

## Install and Configure Sequelize
Added a db folder to include all sequelize related files. To me it feels more oganized vs a models and seed folder in the root
* Create a config folder and config.json file to hold the sequelize configuration
* Defined the two models in separate files in the models folder (course + user)
* Created a index file in the models folder to instantiate a sequelize instance in ./db/models/index and compile a db object depending on the model files present in the models folder
* The starup script in the www file checks if the db and models are in sync and if the db connection is successful

## Validation
Used express-validator instead of sequelize validation. Validating before database submission seems faster and more logical.

## PUT /api/courses/:id 204 - Updates a course and returns no content
The Postman tests imply you always have to update the title and description. This does not make sence. Why wouldn't you be able to only update one attribute?
Therefore:
* My routehandler only validates if the title and/or description is available, if not it skips validation and returns an empty body error
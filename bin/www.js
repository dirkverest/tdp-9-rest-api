const app = require('../app');
const {sequelize} = require('../db/models');

// set port:
app.set('port', process.env.PORT || 5000);

// start listening on port:
const server = app.listen(app.get('port'), () => {
    console.log(`Express server is listening on port ${server.address().port}`);
});

// Sync database
sequelize.sync()
.then(() => {
    console.log(`Your database is in sync with the sequelize models.`);
}).catch( (err) => {
    console.log(`Error syncing the database with the sequelize models:
    ${err}`);
});

// Test the connection to the database:
(async function () {
    try {
        await sequelize.authenticate();
        console.log('DATEBASE: Connection to fsjstd-restapi.db successful.');
    } catch(error) {
        console.error('DATEBASE: Error connecting to fsjstd-restapi.db.')
    }
}());
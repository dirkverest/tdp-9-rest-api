const app = require('../app');
const {sequelize} = require('../db/models');

// set port:
app.set('port', process.env.PORT || 5000);

// start listening on port:
const server = app.listen(app.get('port'), () => {
    console.log(`Express server is listening on port ${server.address().port}`);
});

// Sync database
sequelize.sync();

// Test the connection to the database:
(async function () {
    try {
        await sequelize.authenticate();
        console.log('DATEBASE: Connection to fsjstd-restapi.db successful.');
    } catch(error) {
        console.error('DATEBASE: Error connecting to fsjstd-restapi.db.')
    }
}());
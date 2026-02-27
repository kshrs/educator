const express = require('express');
const app = express();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Middle ware for json
app.use(express.json());


const routes = require('./routes/routes.js');

app.use('/api', routes.router);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server Listening at port ${port}`);
});

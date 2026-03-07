const express = require('express');
const app = express();
const cors = require('cors');

// .env lives one dir up, so explicitly state ../.env to avoid path breakage
const path = require('path');
// live reload of env variables when modified in the health check page.
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const db = require('./config/db.js');
db.connectDB();

//  --- Middlewares ---
app.use(express.json()); // Parses incoming JSON requests into req.body
app.use(cors()); // Enbable Cross-Origin Resouce Sharing(CORS) to communicate with the frontend.


// --- Routes ---
const routes = require('./routes/routes.js');

app.use('/api', routes.router);

const port = 3000;
app.listen(port, () => {
    console.log(`Server Listening at port ${port}`);
});

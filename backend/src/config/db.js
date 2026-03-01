const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}`);

    } catch (e) {
        console.log(`Error Connecting to MongoDB: ${e.message}`);
        process.exit(1);
    }
};

module.exports = {
    connectDB
}

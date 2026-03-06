const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    parts: [{
        text: {
            type: String,
            required: true,
        }
    }]
}, { _id: false });

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    chatHistory: [messageSchema],
    knowledgeLevel: {
        type: String,
        default: "Beginner"
    }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = { User };

const { User } = require('../models/user.model.js');

// dev user name, will be removed during authentication
const DEV_USER = "atom";

const getOrCreateUser = async () => {
    let user = await User.findOne({ username: DEV_USER });
    if (!user) {
        user = await User.create({
            username: DEV_USER,
            chatHistory: []
        });
        console.log(`New user created: ${user}`);
    }
    return user;
}

const getUserName = async () => {
    const user = await getOrCreateUser();
    return user.username;
};

const addChatToHistory = async (role, content) => {
    const user = await getOrCreateUser();
    user.chatHistory.push({role: role, parts: [{ text: content}]});
    await user.save();
};

const getChatHistory = async () => {
    const user = await getOrCreateUser();
    return user.chatHistory;
};

const clearChatHistory = async () => {
    const user = await getOrCreateUser();
    user.chatHistory = [];
    await user.save();
};

module.exports = {
    addChatToHistory,
    getChatHistory,
    getUserName,
    clearChatHistory
}

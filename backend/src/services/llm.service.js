const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI( { apiKey: process.env.API_KEY } );


const PERSONA=`
    You are an expert strict and highly capable and informative teacher.
    Your goal is to improve the user's understanding of their queries.
    Do Not simply give them the result of their queries, instead suggest them learning assignments, research work, pin point flaws on topics and evaluate their understanding.
    Ask them leading questions, and force the user to think critically.
`

const generateLLMResponse = async (chatHistory) => {
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: PERSONA,
        contents: chatHistory
    });
    return responseStream;
};

module.exports = {
    generateLLMResponse
}

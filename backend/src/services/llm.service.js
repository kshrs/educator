const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI( { apiKey: process.env.API_KEY } );


const generateLLMResponse = async (prompt) => {
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return responseStream;
};

module.exports = {
    generateLLMResponse
}

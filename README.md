# Project Educator

## Description
Project Educator is an AI-driven, personalized learning application designed to break away from traditional, rigid curricula. It leverages Large Language Models (LLMs) to dynamically generate and evaluate custom learning paths based on the user's current knowledge level, skill set, and interests.

### Core Goals
- **Dynamic Curriculum:** Generate custom curriculum and learning modules tailored specifically to the user.
- **Progress Tracking:** Evaluate user progress through module assignments and GenAI inference.
- **Interactive Homework:** Require users to research topics externally and write up their findings. The AI evaluates these write-ups based on:
  1. The quality of the user's questions.
  2. The depth of understanding shown in their explanations.
  3. How their conceptual understanding shifts across subsequent conversations.

> *Note: Still a work in progress(first iteration) and Currently, this project exclusively supports the Gemini API for LLM inference.*


---

## Architecture Overview

This project is built using a decoupled microservices architecture.

- **Backend (Node.js & Express):** Acts as the AI orchestrator. It securely manages API keys, processes user prompts via a Level 1 in-memory Ticket System, and streams LLM text generation back to the client using **Server-Sent Events (SSE)**.
- **Frontend (Angular):** A modern, reactive UI utilizing Angular's latest `signal()` architecture for state management. It features a Smart/Dumb component hierarchy to handle user inputs, parse Markdown in real-time, and dynamically render code blocks and text streams.

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [Angular CLI](https://angular.dev/tools/cli) installed globally (`npm install -g @angular/cli`).

### 1. Environment Variables (Backend)
Navigate to the `backend/` directory and create a `.env` file. You must provide a valid Google Gemini API key. 

```env
# backend/.env
API_KEY=your_gemini_api_key_here
PORT=3000
```

### 2. Running the Backend
Open a terminal, navigate to the backend directory, install dependencies, and start the Express server.
```bash
cd backend
npm install
node src/server.js
```
*The backend will start running on http://localhost:3000*

### 3. Running the Frontend
Open a separate terminal, navigate to the frontend directory, install dependencies, and start the Angular development server.
```bash
cd frontend
npm install
ng serve
```
*The frontend will start running on http://localhost:4200*

Navigate to `http://localhost:4200` in your browser to start the application.

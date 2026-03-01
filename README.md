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

- **Database (MongoDB / Docker):** Persistent Level 3 storage running locally via Docker Compose. Utilizes Docker Volumes to ensure data persistence across container restarts.
- **Backend (Node.js, Express, Mongoose):** Acts as the AI orchestrator. It securely manages API keys, interfaces with the database, and streams LLM text generation back to the client using **Server-Sent Events (SSE)**.
- **Frontend (Angular 17+):** A modern, reactive UI utilizing Angular's `signal()` architecture and new control flow (`@for`, `@if`). It features a Smart/Dumb component hierarchy to handle user inputs, parse Markdown in real-time, and dynamically render text streams.

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) installed.
- [Angular CLI](https://angular.dev/tools/cli) installed globally (`npm install -g @angular/cli`).
- [Docker](https://docs.docker.com/engine/install/) and Docker Compose installed and running.

### 1. The Database (Docker Compose)
Navigate to the root directory (`ai-learner`) where the `docker-compose.yml` file is located.
\`\`\`bash
# Pulls the Mongo image (if not cached) and starts the database in the background
docker compose up -d
\`\`\`

### 2. Environment Variables (Backend)
Navigate to the `backend/` directory and create/update your `.env` file. 

\`\`\`env
# backend/.env
API_KEY=your_gemini_api_key_here
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/educator
\`\`\`

### 3. Running the Backend
Open a terminal in the `backend/` directory.
\`\`\`bash
npm install
node src/server.js
\`\`\`
*The server will connect to MongoDB and listen on http://localhost:3000*

### 4. Running the Frontend
Open a separate terminal in the `frontend/` directory.
\`\`\`bash
npm install
ng serve
\`\`\`
*The Angular app will start on http://localhost:4200*

---

## Daily Developer Workflow

When you are done developing for the day, you do not need to destroy the database container. 

- **To stop the database:** Run `docker compose stop` in the root folder.
- **To wake the database:** Run `docker compose start` in the root folder. 
*(Your data is safely stored in a local Docker volume and will persist across reboots).*

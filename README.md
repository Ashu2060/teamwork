# AI Mental Health Chatbot

A production-ready full stack AI mental health chatbot with:

- Real-time Groq-powered chat
- Conversation memory backed by MongoDB
- Personality modes with manual and emotion-based auto switching
- Live face emotion detection in the browser
- Speech-to-text and text-to-speech
- Responsive React UI with dark/light themes

## Folder Structure

```text
lastsem/
|-- backend/
|   |-- package.json
|   |-- .env.example
|   |-- server.js
|   `-- src/
|       |-- app.js
|       |-- config/
|       |   `-- db.js
|       |-- controllers/
|       |   |-- chatController.js
|       |   `-- modeController.js
|       |-- middlewares/
|       |   `-- errorMiddleware.js
|       |-- models/
|       |   |-- ChatSession.js
|       |   `-- UserPreference.js
|       |-- routes/
|       |   |-- chatRoutes.js
|       |   `-- modeRoutes.js
|       |-- services/
|       |   `-- groqService.js
|       `-- utils/
|           `-- modeConfig.js
|-- frontend/
|   |-- package.json
|   |-- .env.example
|   |-- index.html
|   |-- vite.config.js
|   `-- src/
|       |-- App.jsx
|       |-- main.jsx
|       |-- styles.css
|       |-- components/
|       |   |-- ChatHeader.jsx
|       |   |-- ChatWindow.jsx
|       |   |-- Composer.jsx
|       |   |-- EmotionPanel.jsx
|       |   `-- MessageBubble.jsx
|       `-- lib/
|           |-- constants.js
|           |-- emotion.js
|           |-- session.js
|           `-- speech.js
|-- emotion_service/
|   |-- app.py
|   `-- requirements.txt
|-- .gitignore
`-- README.md
```

## Backend

### APIs

- `POST /api/chat`
- `GET /api/chat/:sessionId`
- `POST /api/mode`
- `GET /api/mode/:sessionId`

### Personality Modes

- `life-coach`
- `therapist`
- `friendly-buddy`
- `girlfriend`
- `flirty-girlfriend`

Emotion to auto-mode mapping:

- `sad -> therapist`
- `happy -> friendly-buddy`
- `angry -> therapist`
- `stressed -> life-coach`
- `neutral -> therapist`

## Emotion Service

### DeepFace Emotion Detection

For stronger emotion detection, this project now supports a local Python DeepFace microservice.

Setup:

```bash
cd emotion_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

The backend proxies webcam snapshots to:

```text
http://127.0.0.1:8001/analyze
```

Configure this in `backend/.env` if needed:

```env
EMOTION_SERVICE_URL=http://127.0.0.1:8001/analyze
```

## Frontend

### Included Features

- React functional components with hooks
- Chat-style message layout
- Dark and light themes
- Voice input with Web Speech API
- AI voice output with SpeechSynthesis API
- Local-only webcam emotion detection with `face-api.js`
- Responsive design for desktop and mobile

Note:
- Face presence box and webcam overlay still run in the browser
- Emotion label accuracy is improved by the local DeepFace service

## Environment Setup

### Backend `.env`

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mental-health-chatbot
GROQ_API_KEY=your_groq_api_key_here
CLIENT_URL=http://localhost:5173
GROQ_MODEL=llama-3.3-70b-versatile
```

### Frontend `.env`

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FACE_API_MODEL_URL=https://justadudewhohacks.github.io/face-api.js/models
```

## Run Locally

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Start MongoDB

Use a local MongoDB instance or free MongoDB Atlas connection string.

### 3. Start the backend

```bash
cd backend
npm run dev
```

### 4. Start the DeepFace emotion service

```bash
cd emotion_service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

### 5. Start the frontend

```bash
cd frontend
npm run dev
```

### 6. Open the app

```text
http://localhost:5173
```

## Deploy Live

This stack deploys best as three services:

- `frontend` as a static site
- `backend` as a Node web service
- `emotion_service` as a Python web service

This repo includes a ready Render blueprint at [render.yaml](c:/Users/Ashutosh%20Kumar%20Jha/Desktop/lastsem/render.yaml).

### Recommended hosting

- Frontend: Render Static Site
- Backend: Render Node Web Service
- Emotion service: Render Python Web Service
- Database: MongoDB Atlas

### Production environment values

Backend:

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_uri
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
CLIENT_URL=https://your-frontend-domain.onrender.com
EMOTION_SERVICE_URL=https://your-emotion-service.onrender.com/analyze
```

Frontend:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
VITE_FACE_API_MODEL_URL=https://justadudewhohacks.github.io/face-api.js/models
```

### Important production note

- The current Piper setup is for local Windows use.
- For live hosting, let the frontend use browser speech fallback unless you later add a Linux-compatible server TTS setup.
- The app still works live without server-side Piper.

## Integration Flow

1. The frontend creates a local session ID and restores preferences.
2. The webcam preview and face box run locally in the browser.
3. The frontend sends a compressed local snapshot to the DeepFace emotion service for stronger emotion analysis.
4. The backend receives the detected emotion label and combines it with the selected mode.
5. Express builds an emotion-aware Groq prompt using the active personality.
6. MongoDB stores the latest messages and preferences.
7. The AI reply is shown in the chat and spoken aloud with mode-based voice tone.

## Privacy Notes

- For stronger DeepFace detection, compressed webcam snapshots are sent to your local emotion service.
- The main chat backend still only uses the derived emotion label, not raw video streams.
- Camera and microphone permissions are handled by the browser.

## Browser Notes

- `SpeechRecognition` works best in Chrome and Edge.
- For stronger production hosting, self-host the face-api model files instead of the default public model URL.
- This app is a mental wellness companion and not a replacement for professional care.

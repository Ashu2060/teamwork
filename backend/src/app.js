import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import chatRoutes from "./routes/chatRoutes.js";
import emotionRoutes from "./routes/emotionRoutes.js";
import modeRoutes from "./routes/modeRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5174"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/chat", chatRoutes);
app.use("/api/emotion", emotionRoutes);
app.use("/api/mode", modeRoutes);
app.use("/api/voice", voiceRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

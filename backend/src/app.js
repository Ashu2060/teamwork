import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import chatRoutes from "./routes/chatRoutes.js";
import modeRoutes from "./routes/modeRoutes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
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
app.use("/api/mode", modeRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

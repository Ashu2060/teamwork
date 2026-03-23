import dotenv from "dotenv";
import app from "./src/app.js";
import connectDatabase from "./src/config/db.js";
import { configureBundledVoiceRuntime } from "./src/config/voiceRuntime.js";

dotenv.config();
configureBundledVoiceRuntime();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend:", error.message);
  process.exit(1);
});

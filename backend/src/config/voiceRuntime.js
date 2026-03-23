import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..", "..");
const modelsDir = path.join(backendRoot, "piper", "models");
const linuxRuntimeDir = path.join(backendRoot, "piper", "runtime", "linux", "piper");

const fileExists = (targetPath) => {
  try {
    fs.accessSync(targetPath);
    return true;
  } catch {
    return false;
  }
};

const defaultHindiModelPath = path.join(modelsDir, "hi_IN-priyamvada-medium.onnx");
const defaultEnglishModelPath = path.join(modelsDir, "en_US-lessac-medium.onnx");
const defaultLinuxPiperPath = path.join(linuxRuntimeDir, "piper");

const ensureDefaultVoiceEnv = (envKey, value) => {
  if (!process.env[envKey] && fileExists(value)) {
    process.env[envKey] = value;
  }
};

export const configureBundledVoiceRuntime = () => {
  if (process.platform === "linux") {
    ensureDefaultVoiceEnv("PIPER_EXECUTABLE_PATH", defaultLinuxPiperPath);
  }

  ensureDefaultVoiceEnv("PIPER_DEFAULT_MODEL_PATH", defaultHindiModelPath);
  ensureDefaultVoiceEnv("PIPER_GIRLFRIEND_MODEL_PATH", defaultHindiModelPath);
  ensureDefaultVoiceEnv("PIPER_FLIRTY_GIRLFRIEND_MODEL_PATH", defaultHindiModelPath);

  if (!process.env.PIPER_MODEL_CONFIG_PATH) {
    const activeModelPath = process.env.PIPER_DEFAULT_MODEL_PATH || defaultHindiModelPath;
    const inferredConfigPath = `${activeModelPath}.json`;

    if (fileExists(inferredConfigPath)) {
      process.env.PIPER_MODEL_CONFIG_PATH = inferredConfigPath;
    }
  }

  if (!process.env.PIPER_ENGLISH_MODEL_PATH && fileExists(defaultEnglishModelPath)) {
    process.env.PIPER_ENGLISH_MODEL_PATH = defaultEnglishModelPath;
  }
};

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepareTextForHindiVoice } from "./groqService.js";

const modeModelEnvMap = {
  girlfriend: "PIPER_GIRLFRIEND_MODEL_PATH",
  "flirty-girlfriend": "PIPER_FLIRTY_GIRLFRIEND_MODEL_PATH",
  therapist: "PIPER_DEFAULT_MODEL_PATH",
  "friendly-buddy": "PIPER_DEFAULT_MODEL_PATH",
  "life-coach": "PIPER_DEFAULT_MODEL_PATH"
};

export const voiceFeatureEnabled = () =>
  Boolean(process.env.PIPER_EXECUTABLE_PATH && process.env.PIPER_DEFAULT_MODEL_PATH);

const getModelPathForMode = (mode) => {
  const envKey = modeModelEnvMap[mode] || "PIPER_DEFAULT_MODEL_PATH";
  return process.env[envKey] || process.env.PIPER_DEFAULT_MODEL_PATH;
};

const shouldUseHindiVoicePrep = (modelPath) => /hi[_-]IN/i.test(modelPath || "");

const getPiperArgs = ({ modelPath, outputPath }) => {
  const args = ["-m", modelPath, "-f", outputPath];
  const configPath = process.env.PIPER_MODEL_CONFIG_PATH;

  if (configPath) {
    args.push("-c", configPath);
  }

  return args;
};

export const synthesizeSpeech = async ({ text, mode = "therapist" }) => {
  const executablePath = process.env.PIPER_EXECUTABLE_PATH;
  const modelPath = getModelPathForMode(mode);

  if (!executablePath || !modelPath) {
    throw new Error("Piper voice settings are missing");
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "moodmate-piper-"));
  const outputPath = path.join(tempDir, `${Date.now()}.wav`);
  const args = getPiperArgs({ modelPath, outputPath });
  const spokenText = shouldUseHindiVoicePrep(modelPath)
    ? await prepareTextForHindiVoice(text)
    : text;

  await new Promise((resolve, reject) => {
    const child = spawn(executablePath, args, {
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stderr = "";

    child.stdin.write(spokenText, "utf8");
    child.stdin.end();

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(new Error(`Piper failed to start: ${error.message}`));
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Piper synthesis failed: ${stderr || `exit code ${code}`}`));
        return;
      }

      resolve();
    });
  });

  const audioBuffer = await fs.readFile(outputPath);
  await fs.rm(tempDir, { recursive: true, force: true });
  return audioBuffer;
};

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const linuxRuntimeDir = path.join(backendRoot, "piper", "runtime", "linux");
const archivePath = path.join(linuxRuntimeDir, "piper_linux_x86_64.tar.gz");
const binaryPath = path.join(linuxRuntimeDir, "piper", "piper");
const downloadUrl =
  "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz";

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const fileExists = (targetPath) => {
  try {
    fs.accessSync(targetPath);
    return true;
  } catch {
    return false;
  }
};

const downloadArchive = async () => {
  const response = await fetch(downloadUrl, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Failed to download Piper runtime: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(archivePath, Buffer.from(arrayBuffer));
};

const extractArchive = () => {
  execFileSync("tar", ["-xzf", archivePath, "-C", linuxRuntimeDir], {
    stdio: "inherit"
  });
};

const main = async () => {
  if (process.platform !== "linux") {
    console.log("Skipping Linux Piper setup on non-Linux platform.");
    return;
  }

  if (fileExists(binaryPath)) {
    console.log("Linux Piper runtime already present.");
    return;
  }

  ensureDir(linuxRuntimeDir);
  console.log("Downloading Linux Piper runtime...");
  await downloadArchive();
  console.log("Extracting Linux Piper runtime...");
  extractArchive();
  fs.chmodSync(binaryPath, 0o755);
  console.log("Linux Piper runtime is ready.");
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

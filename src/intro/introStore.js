const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const introDir = path.join(__dirname, "../../data/intros");
const maxSeconds = 15;

let ffmpegPath = "ffmpeg";
try {
  const staticPath = require("ffmpeg-static");
  if (staticPath && fs.existsSync(staticPath)) ffmpegPath = staticPath;
} catch (error) {}

fs.mkdirSync(introDir, { recursive: true });

const introPath = (userId) => path.join(introDir, `${userId}.ogg`);

const hasIntro = (userId) => fs.existsSync(introPath(userId));

const removeIntro = (userId) => {
  if (!hasIntro(userId)) return false;
  fs.unlinkSync(introPath(userId));
  return true;
};

// Wandelt beliebiges Audio in Ogg/Opus um (so wie die anderen Sounds im Bot)
// und schneidet es auf maxSeconds ab. Die Eingabe wird erst als Datei
// gespeichert, weil ffmpeg z.B. MP4/M4A über eine Pipe nicht richtig lesen kann.
const minOutputBytes = 2048;

const saveIntro = (userId, buffer) =>
  new Promise((resolve, reject) => {
    const uploadPath = `${introPath(userId)}.upload`;
    const tmpPath = `${introPath(userId)}.tmp`;
    const cleanup = () => {
      fs.rmSync(uploadPath, { force: true });
      fs.rmSync(tmpPath, { force: true });
    };

    fs.writeFileSync(uploadPath, buffer);
    const ffmpeg = spawn(ffmpegPath, [
      "-hide_banner",
      "-loglevel", "error",
      "-i", uploadPath,
      "-t", String(maxSeconds),
      "-vn",
      "-ac", "2",
      "-ar", "48000",
      "-c:a", "libopus",
      "-b:a", "96k",
      "-f", "ogg",
      "-y", tmpPath,
    ]);

    let stderr = "";
    ffmpeg.stderr.on("data", (data) => (stderr += data));
    ffmpeg.on("error", (error) => {
      cleanup();
      reject(error);
    });
    ffmpeg.on("close", (code) => {
      if (code !== 0 || !fs.existsSync(tmpPath)) {
        cleanup();
        return reject(new Error(`ffmpeg exited with ${code}: ${stderr.trim()}`));
      }
      // Nur Header, aber kein Ton drin -> altes Intro behalten
      if (fs.statSync(tmpPath).size < minOutputBytes) {
        cleanup();
        return reject(new Error(`ffmpeg produced no audio: ${stderr.trim()}`));
      }
      fs.renameSync(tmpPath, introPath(userId));
      cleanup();
      resolve();
    });
  });

module.exports = { introPath, hasIntro, removeIntro, saveIntro, maxSeconds };

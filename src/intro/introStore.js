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
// und schneidet es auf maxSeconds ab.
const saveIntro = (userId, buffer) =>
  new Promise((resolve, reject) => {
    const tmpPath = `${introPath(userId)}.tmp`;
    const ffmpeg = spawn(ffmpegPath, [
      "-hide_banner",
      "-loglevel", "error",
      "-i", "pipe:0",
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
    ffmpeg.on("error", reject);
    ffmpeg.on("close", (code) => {
      if (code !== 0 || !fs.existsSync(tmpPath)) {
        fs.rmSync(tmpPath, { force: true });
        return reject(new Error(`ffmpeg exited with ${code}: ${stderr.trim()}`));
      }
      fs.renameSync(tmpPath, introPath(userId));
      resolve();
    });

    // Fehler beim Schreiben (z.B. ffmpeg bricht früh ab) werden über "close" gemeldet
    ffmpeg.stdin.on("error", () => {});
    ffmpeg.stdin.end(buffer);
  });

module.exports = { introPath, hasIntro, removeIntro, saveIntro, maxSeconds };

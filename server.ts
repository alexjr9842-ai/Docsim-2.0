import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import JSZip from "jszip";
import { createServer as createViteServer } from "vite";

const execAsync = promisify(exec);
const PORT = 3000;
const REPO_DIR = path.resolve(process.cwd(), "docsim_repo");

// Ensure repo directory exists
if (!fs.existsSync(REPO_DIR)) {
  fs.mkdirSync(REPO_DIR, { recursive: true });
}

interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  extension?: string;
  children?: FileEntry[];
}

function getDirectoryTree(dirPath: string, relativeRoot = ""): FileEntry[] {
  if (!fs.existsSync(dirPath)) return [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const entries: FileEntry[] = [];

  for (const item of items) {
    if (item.name === ".git") continue; // skip internal git objects
    const fullPath = path.join(dirPath, item.name);
    const relPath = relativeRoot ? `${relativeRoot}/${item.name}` : item.name;

    if (item.isDirectory()) {
      entries.push({
        name: item.name,
        path: relPath,
        type: "directory",
        children: getDirectoryTree(fullPath, relPath),
      });
    } else {
      const stats = fs.statSync(fullPath);
      const ext = path.extname(item.name).toLowerCase();
      entries.push({
        name: item.name,
        path: relPath,
        type: "file",
        size: stats.size,
        extension: ext,
      });
    }
  }

  // Sort directories first, then alphabetically
  return entries.sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === "directory" ? -1 : 1;
  });
}

function isBinaryExtension(ext: string): boolean {
  return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".ttf", ".otf", ".woff", ".woff2", ".ico", ".psd"].includes(ext);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Static serving for repo assets (template backgrounds, fonts, people images)
  app.use("/repo-assets", (req, res, next) => {
    const filePath = path.join(REPO_DIR, decodeURIComponent(req.path));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".ttf") res.setHeader("Content-Type", "font/ttf");
      if (ext === ".otf") res.setHeader("Content-Type", "font/otf");
      if (ext === ".jpg" || ext === ".jpeg") res.setHeader("Content-Type", "image/jpeg");
      if (ext === ".png") res.setHeader("Content-Type", "image/png");
      return res.sendFile(filePath);
    }
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", repoExists: fs.existsSync(REPO_DIR) });
  });

  // 1. Get entire file tree
  app.get("/api/files", (_req, res) => {
    try {
      const tree = getDirectoryTree(REPO_DIR);
      res.json({ success: true, tree });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Read file content
  app.get("/api/file", (req, res) => {
    try {
      const relPath = req.query.path as string;
      if (!relPath) {
        return res.status(400).json({ success: false, error: "Path parameter is required" });
      }
      const safePath = path.resolve(REPO_DIR, relPath);
      if (!safePath.startsWith(REPO_DIR)) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      if (!fs.existsSync(safePath)) {
        return res.status(404).json({ success: false, error: "File not found" });
      }

      const stats = fs.statSync(safePath);
      if (stats.isDirectory()) {
        return res.status(400).json({ success: false, error: "Path is a directory" });
      }

      const ext = path.extname(safePath).toLowerCase();
      const isBinary = isBinaryExtension(ext);

      if (isBinary) {
        const buffer = fs.readFileSync(safePath);
        const mimeType =
          ext === ".png"
            ? "image/png"
            : ext === ".ttf"
            ? "font/ttf"
            : ext === ".otf"
            ? "font/otf"
            : ext === ".psd"
            ? "image/vnd.adobe.photoshop"
            : "image/jpeg";

        return res.json({
          success: true,
          path: relPath,
          isBinary: true,
          isPsd: ext === ".psd",
          mimeType,
          base64: buffer.toString("base64"),
          size: stats.size,
        });
      }

      const content = fs.readFileSync(safePath, "utf-8");
      res.json({
        success: true,
        path: relPath,
        isBinary: false,
        content,
        size: stats.size,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Save file content
  app.post("/api/file", (req, res) => {
    try {
      const { path: relPath, content, base64, isBase64 } = req.body;
      if (!relPath) {
        return res.status(400).json({ success: false, error: "Path parameter is required" });
      }
      const safePath = path.resolve(REPO_DIR, relPath);
      if (!safePath.startsWith(REPO_DIR)) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }

      const dir = path.dirname(safePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (isBase64 && base64) {
        fs.writeFileSync(safePath, Buffer.from(base64, "base64"));
      } else if (content !== undefined) {
        fs.writeFileSync(safePath, content, "utf-8");
      }
      res.json({ success: true, message: "File saved successfully", path: relPath });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3b. List all PSD files across the repository
  app.get("/api/psds", (_req, res) => {
    try {
      const psds: string[] = [];
      function findPsds(dir: string) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === ".git" || entry.name === "node_modules") continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            findPsds(fullPath);
          } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".psd") {
            psds.push(path.relative(REPO_DIR, fullPath));
          }
        }
      }
      findPsds(REPO_DIR);
      res.json({ success: true, psds });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Create file or directory
  app.post("/api/file/create", (req, res) => {
    try {
      const { path: relPath, isDirectory } = req.body;
      if (!relPath) {
        return res.status(400).json({ success: false, error: "Path is required" });
      }
      const safePath = path.resolve(REPO_DIR, relPath);
      if (!safePath.startsWith(REPO_DIR)) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      if (fs.existsSync(safePath)) {
        return res.status(400).json({ success: false, error: "Already exists" });
      }

      if (isDirectory) {
        fs.mkdirSync(safePath, { recursive: true });
      } else {
        const dir = path.dirname(safePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(safePath, "", "utf-8");
      }
      res.json({ success: true, message: "Created successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Delete file or directory
  app.post("/api/file/delete", (req, res) => {
    try {
      const { path: relPath } = req.body;
      if (!relPath) {
        return res.status(400).json({ success: false, error: "Path is required" });
      }
      const safePath = path.resolve(REPO_DIR, relPath);
      if (!safePath.startsWith(REPO_DIR) || safePath === REPO_DIR) {
        return res.status(403).json({ success: false, error: "Cannot delete repository root" });
      }
      if (!fs.existsSync(safePath)) {
        return res.status(404).json({ success: false, error: "Item not found" });
      }

      const stats = fs.statSync(safePath);
      if (stats.isDirectory()) {
        fs.rmSync(safePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(safePath);
      }
      res.json({ success: true, message: "Deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Rename file or directory
  app.post("/api/file/rename", (req, res) => {
    try {
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) {
        return res.status(400).json({ success: false, error: "Old and new paths are required" });
      }
      const safeOld = path.resolve(REPO_DIR, oldPath);
      const safeNew = path.resolve(REPO_DIR, newPath);
      if (!safeOld.startsWith(REPO_DIR) || !safeNew.startsWith(REPO_DIR)) {
        return res.status(403).json({ success: false, error: "Access denied" });
      }
      if (!fs.existsSync(safeOld)) {
        return res.status(404).json({ success: false, error: "Source not found" });
      }
      if (fs.existsSync(safeNew)) {
        return res.status(400).json({ success: false, error: "Destination already exists" });
      }

      fs.renameSync(safeOld, safeNew);
      res.json({ success: true, message: "Renamed successfully" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Git status
  app.get("/api/git/status", async (_req, res) => {
    try {
      const { stdout: statusOutput } = await execAsync("git status --porcelain=v1", { cwd: REPO_DIR });
      const { stdout: branchOutput } = await execAsync("git branch --show-current", { cwd: REPO_DIR });

      const lines = statusOutput.split("\n").filter(Boolean);
      const modified: string[] = [];
      const untracked: string[] = [];
      const staged: string[] = [];
      const deleted: string[] = [];

      for (const line of lines) {
        const code = line.substring(0, 2);
        const filePath = line.substring(3).trim();
        if (code.includes("M")) modified.push(filePath);
        else if (code.includes("??")) untracked.push(filePath);
        else if (code.includes("D")) deleted.push(filePath);
        else staged.push(filePath);
      }

      res.json({
        success: true,
        branch: branchOutput.trim() || "master",
        isClean: lines.length === 0,
        totalChanges: lines.length,
        modified,
        untracked,
        staged,
        deleted,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Git diff
  app.get("/api/git/diff", async (req, res) => {
    try {
      const filePath = req.query.path as string | undefined;
      const cmd = filePath ? `git diff -- "${filePath}"` : "git diff";
      const { stdout } = await execAsync(cmd, { cwd: REPO_DIR });
      res.json({ success: true, diff: stdout });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Git commit
  app.post("/api/git/commit", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: "Commit message is required" });
      }
      await execAsync("git add -A", { cwd: REPO_DIR });
      const safeMessage = message.replace(/"/g, '\\"');
      const { stdout } = await execAsync(`git commit -m "${safeMessage}"`, { cwd: REPO_DIR });
      res.json({ success: true, message: "Committed successfully", details: stdout });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 10. Git discard / revert
  app.post("/api/git/discard", async (req, res) => {
    try {
      const { path: filePath } = req.body;
      if (filePath) {
        await execAsync(`git checkout -- "${filePath}" || git clean -fd "${filePath}"`, { cwd: REPO_DIR });
      } else {
        await execAsync("git checkout . && git clean -fd", { cwd: REPO_DIR });
      }
      res.json({ success: true, message: "Changes discarded" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 11. Git commit log
  app.get("/api/git/log", async (_req, res) => {
    try {
      const { stdout } = await execAsync('git log -n 15 --pretty=format:"%h%x09%an%x09%ad%x09%s" --date=relative', {
        cwd: REPO_DIR,
      });
      const commits = stdout
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [hash, author, date, subject] = line.split("\t");
          return { hash, author, date, subject };
        });
      res.json({ success: true, commits });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 12. Export entire repository as ZIP
  app.get("/api/export/zip", async (_req, res) => {
    try {
      const zip = new JSZip();

      function addFolderToZip(dir: string, currentZipFolder: JSZip) {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.name === ".git") continue;
          const fullPath = path.join(dir, item.name);
          if (item.isDirectory()) {
            const nextFolder = currentZipFolder.folder(item.name);
            if (nextFolder) addFolderToZip(fullPath, nextFolder);
          } else {
            const data = fs.readFileSync(fullPath);
            currentZipFolder.file(item.name, data);
          }
        }
      }

      addFolderToZip(REPO_DIR, zip);
      const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="DocSim-AI4Bharat-modified.zip"');
      res.send(zipBuffer);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`DocSim Studio server running on port ${PORT}`);
  });
}

startServer();

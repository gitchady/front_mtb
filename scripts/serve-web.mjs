import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "apps", "web", "dist");
const port = Number(process.env.PORT ?? 4173);
const host = "0.0.0.0";

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function resolveRequestPath(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  } catch {
    return null;
  }

  const requestedPath = path.normalize(path.join(distDir, pathname));
  const relativePath = path.relative(distDir, requestedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return requestedPath;
}

async function getFilePath(url) {
  const requestedPath = resolveRequestPath(url);

  if (!requestedPath) {
    return { filePath: null, status: 403 };
  }

  try {
    const fileStat = await stat(requestedPath);
    if (fileStat.isFile()) {
      return { filePath: requestedPath, status: 200 };
    }
  } catch {
    const isAsset = new URL(url, "http://localhost").pathname.startsWith("/assets/");
    if (isAsset) {
      return { filePath: null, status: 404 };
    }
  }

  return { filePath: path.join(distDir, "index.html"), status: 200 };
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    response.writeHead(400).end("Bad Request");
    return;
  }

  const { filePath, status } = await getFilePath(request.url);

  if (!filePath) {
    response.writeHead(status).end(status === 403 ? "Forbidden" : "Not Found");
    return;
  }

  const extension = path.extname(filePath);
  const headers = {
    "Content-Type": mimeTypes.get(extension) ?? "application/octet-stream",
  };

  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  }

  response.writeHead(status, headers);
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Web server listening on ${host}:${port}`);
});

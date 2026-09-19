import { handleChat } from "../api/chat.js";
import { handleStatus } from "../api/status.js";
import { handleReportEmail } from "../api/report-email.js";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve({ __raw: raw });
      }
    });
    req.on("error", reject);
  });
}

function createRes(nodeRes) {
  return {
    status(code) {
      nodeRes.statusCode = code;
      return this;
    },
    json(payload) {
      nodeRes.setHeader("Content-Type", "application/json; charset=utf-8");
      nodeRes.end(JSON.stringify(payload));
    },
  };
}

export function createDevApiPlugin(env) {
  Object.assign(process.env, env);
  return {
    name: "hoeseo-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split("?")[0];
        if (!url?.startsWith("/api/")) return next();
        const fakeReq = {
          method: req.method,
          headers: req.headers,
          body: req.method === "GET" ? {} : await readBody(req),
        };
        const fakeRes = createRes(res);
        try {
          if (url === "/api/chat") return handleChat(fakeReq, fakeRes);
          if (url === "/api/status") return handleStatus(fakeReq, fakeRes);
          if (url === "/api/report-email") return handleReportEmail(fakeReq, fakeRes);
          fakeRes.status(404).json({ error: "Not found" });
        } catch (error) {
          fakeRes.status(500).json({ error: error.message || "서버 오류" });
        }
      });
    },
  };
}

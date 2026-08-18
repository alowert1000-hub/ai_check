const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const indexPath = path.join(dist, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("dist/index.html 이 없습니다. 먼저 `npx expo export -p web` 을 실행하세요.");
  process.exit(1);
}

let html = fs.readFileSync(indexPath, "utf8");

if (process.env.GITHUB_PAGES === "1") {
  const assets = [
    "manifest.json",
    "apple-touch-icon.png",
    "favicon.png",
    "logo192.png",
    "logo512.png",
  ];
  for (const asset of assets) {
    html = html.replaceAll(`/${asset}`, `/ai_check/${asset}`);
    html = html.replaceAll(`/ai_check/ai_check/${asset}`, `/ai_check/${asset}`);
  }
}

fs.writeFileSync(indexPath, html);
fs.writeFileSync(path.join(dist, "404.html"), html);
fs.writeFileSync(path.join(dist, ".nojekyll"), "");
console.log(
  `web dist ready (github pages: ${process.env.GITHUB_PAGES === "1" ? "yes" : "no"})`
);

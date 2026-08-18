const appJson = require("./app.json");

// GitHub Pages project site is https://<user>.github.io/ai_check/
const forGitHubPages = process.env.GITHUB_PAGES === "1";

module.exports = {
  expo: {
    ...appJson.expo,
    experiments: {
      ...appJson.expo.experiments,
      baseUrl: forGitHubPages ? "/ai_check" : "",
    },
  },
};

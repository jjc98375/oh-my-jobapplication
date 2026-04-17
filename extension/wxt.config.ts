import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "oh-my-jobapplication",
    description: "AI-powered job application automation",
    permissions: ["storage", "activeTab", "tabs"],
    host_permissions: ["https://www.linkedin.com/*", "http://localhost:3000/*", "http://localhost:8000/*"],
  },
});

import { detectAdapter } from "@/adapters/detector";

export default defineContentScript({
  matches: ["*://www.linkedin.com/*"],
  main() {
    browser.runtime.onMessage.addListener(async (message) => {
      const adapter = detectAdapter(window.location.href);

      switch (message.type) {
        case "SCRAPE_LISTINGS":
          if (!adapter) return { listings: [], error: "No adapter for this URL" };
          if (adapter.detectLoginWall()) return { listings: [], error: "LOGIN_WALL" };
          if (adapter.detectCaptcha()) return { listings: [], error: "CAPTCHA" };
          return { listings: await adapter.scrapeListings() };

        case "EXTRACT_FIELDS":
          if (!adapter) return { fields: [], error: "No adapter" };
          const fields = await adapter.extractFormFields();
          return { fields: fields.map((f) => ({ fieldId: f.fieldId, label: f.label, fieldType: f.fieldType, options: f.options, required: f.required })) };

        case "FILL_FIELD":
          if (!adapter) return { success: false };
          const allFields = await adapter.extractFormFields();
          const field = allFields.find((f) => f.fieldId === message.fieldId);
          if (field) { await adapter.fillField(field, message.value); return { success: true }; }
          return { success: false };

        case "CLICK_SUBMIT":
          if (!adapter) return { success: false };
          return { success: await adapter.clickSubmit() };

        case "OPEN_APPLICATION":
          if (!adapter) return { success: false };
          return { success: await adapter.openApplication(message.job) };

        case "CHECK_LOGIN_WALL":
          if (!adapter) return { loginWall: false, captcha: false };
          return { loginWall: adapter.detectLoginWall(), captcha: adapter.detectCaptcha() };
      }
    });
  },
});

import type { JobListing } from "@/lib/types";
import type { PlatformAdapter, FormField } from "./base";

export class LinkedInAdapter implements PlatformAdapter {
  matches(url: string): boolean {
    return url.includes("linkedin.com/jobs") || url.includes("linkedin.com/my-items/saved-jobs");
  }

  platformName(): string { return "linkedin"; }

  async scrapeListings(): Promise<JobListing[]> {
    const listings: JobListing[] = [];
    const jobCards = document.querySelectorAll<HTMLElement>(
      ".jobs-search-results__list-item, .job-card-container, [data-job-id]"
    );
    for (const card of jobCards) {
      const titleEl = card.querySelector<HTMLElement>(
        ".job-card-list__title, .artdeco-entity-lockup__title a, a[data-control-name='jobPosting_title']"
      );
      const companyEl = card.querySelector<HTMLElement>(
        ".job-card-container__primary-description, .artdeco-entity-lockup__subtitle"
      );
      if (titleEl) {
        const title = titleEl.textContent?.trim() ?? "Untitled";
        const company = companyEl?.textContent?.trim() ?? "Unknown";
        const href = titleEl.closest("a")?.href ?? titleEl.querySelector("a")?.href;
        if (href) listings.push({ title, company, applyUrl: href });
      }
    }
    return listings;
  }

  async openApplication(job: JobListing): Promise<boolean> {
    window.location.href = job.applyUrl;
    return new Promise((resolve) => {
      const check = setInterval(() => {
        const easyApplyBtn = document.querySelector<HTMLButtonElement>(
          ".jobs-apply-button, button[aria-label*='Easy Apply']"
        );
        if (easyApplyBtn) {
          clearInterval(check);
          easyApplyBtn.click();
          setTimeout(() => resolve(true), 1500);
        }
      }, 500);
      setTimeout(() => { clearInterval(check); resolve(false); }, 15000);
    });
  }

  async extractFormFields(): Promise<FormField[]> {
    const fields: FormField[] = [];
    const modal = ".jobs-easy-apply-modal";

    // Text inputs
    for (const input of document.querySelectorAll<HTMLInputElement>(
      `${modal} input[type='text'], ${modal} input[type='tel'], ${modal} input[type='email'], ${modal} input[type='number']`
    )) {
      fields.push({ fieldId: input.id || input.name || `input-${fields.length}`, label: this.findLabel(input), fieldType: "text", required: input.required, element: input });
    }

    // Textareas
    for (const textarea of document.querySelectorAll<HTMLTextAreaElement>(`${modal} textarea`)) {
      fields.push({ fieldId: textarea.id || textarea.name || `textarea-${fields.length}`, label: this.findLabel(textarea), fieldType: "textarea", required: textarea.required, element: textarea });
    }

    // Selects
    for (const select of document.querySelectorAll<HTMLSelectElement>(`${modal} select`)) {
      const options = Array.from(select.options).filter((o) => o.value).map((o) => o.textContent?.trim() ?? o.value);
      fields.push({ fieldId: select.id || select.name || `select-${fields.length}`, label: this.findLabel(select), fieldType: "select", options, required: select.required, element: select });
    }

    // Radio groups
    for (const group of document.querySelectorAll<HTMLElement>(`${modal} fieldset, ${modal} [role='radiogroup']`)) {
      const legend = group.querySelector("legend, label")?.textContent?.trim() ?? "";
      const radios = group.querySelectorAll<HTMLInputElement>("input[type='radio']");
      const options = Array.from(radios).map((r) => r.closest("label")?.textContent?.trim() ?? r.value);
      if (radios.length > 0) {
        fields.push({ fieldId: radios[0].name || `radio-${fields.length}`, label: legend, fieldType: "radio", options, required: radios[0].required, element: group });
      }
    }

    // File inputs
    for (const input of document.querySelectorAll<HTMLInputElement>(`${modal} input[type='file']`)) {
      fields.push({ fieldId: input.id || input.name || `file-${fields.length}`, label: "Resume Upload", fieldType: "file", required: input.required, element: input });
    }

    return fields;
  }

  async fillField(field: FormField, value: string): Promise<void> {
    if (field.fieldType === "text" || field.fieldType === "textarea") {
      const input = field.element as HTMLInputElement | HTMLTextAreaElement;
      const proto = field.fieldType === "textarea" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (nativeSetter) {
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else if (field.fieldType === "select") {
      const select = field.element as HTMLSelectElement;
      const option = Array.from(select.options).find(
        (o) => o.textContent?.trim().toLowerCase() === value.toLowerCase() || o.value.toLowerCase() === value.toLowerCase()
      );
      if (option) { select.value = option.value; select.dispatchEvent(new Event("change", { bubbles: true })); }
    } else if (field.fieldType === "radio") {
      for (const radio of field.element.querySelectorAll<HTMLInputElement>("input[type='radio']")) {
        const label = radio.closest("label")?.textContent?.trim() ?? radio.value;
        if (label.toLowerCase().includes(value.toLowerCase())) { radio.click(); break; }
      }
    }
  }

  async uploadResume(): Promise<void> {
    // MVP: LinkedIn Easy Apply uses user's existing uploaded resume
  }

  clickSubmit(): Promise<boolean> {
    return new Promise((resolve) => {
      const submitBtn = document.querySelector<HTMLButtonElement>(
        "button[aria-label='Submit application'], button[aria-label='Review your application']"
      );
      const nextBtn = document.querySelector<HTMLButtonElement>("button[aria-label='Continue to next step']");
      const btn = submitBtn ?? nextBtn;
      if (btn) { btn.click(); setTimeout(() => resolve(true), 1000); }
      else { resolve(false); }
    });
  }

  detectLoginWall(): boolean {
    return document.querySelector(".login__form, .join-form") !== null ||
      window.location.href.includes("/login") || window.location.href.includes("/checkpoint");
  }

  detectCaptcha(): boolean {
    return document.querySelector("[data-captcha], .captcha, iframe[src*='captcha']") !== null;
  }

  private findLabel(element: HTMLElement): string {
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;
    const id = element.id;
    if (id) { const label = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`); if (label) return label.textContent?.trim() ?? ""; }
    const parentLabel = element.closest("label");
    if (parentLabel) return parentLabel.textContent?.trim() ?? "";
    const prev = element.previousElementSibling;
    if (prev && (prev.tagName === "LABEL" || prev.tagName === "SPAN")) return prev.textContent?.trim() ?? "";
    return element.getAttribute("placeholder") ?? "";
  }
}

import type { JobListing } from "@/lib/types";

export interface FormField {
  fieldId: string;
  label: string;
  fieldType: "text" | "textarea" | "select" | "radio" | "checkbox" | "file";
  options?: string[];
  required: boolean;
  element: HTMLElement;
}

export interface PlatformAdapter {
  matches(url: string): boolean;
  scrapeListings(): Promise<JobListing[]>;
  openApplication(job: JobListing): Promise<boolean>;
  extractFormFields(): Promise<FormField[]>;
  fillField(field: FormField, value: string): Promise<void>;
  uploadResume(field: FormField, resumeUrl: string): Promise<void>;
  clickSubmit(): Promise<boolean>;
  detectLoginWall(): boolean;
  detectCaptcha(): boolean;
  platformName(): string;
}

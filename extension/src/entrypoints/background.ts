import { authStorage, statusStorage } from "@/lib/storage";
import { fetchExtensionToken, getScreeningAnswers, getFieldMappings, getUserProfile, reportApplication } from "@/lib/api";
import type { JobListing, LogEntry, ApplyStatus } from "@/lib/types";

let skipRequested = false;

function log(message: string, type: LogEntry["type"] = "info"): LogEntry {
  return { time: new Date().toLocaleTimeString(), message, type };
}

async function addLog(entry: LogEntry) {
  const status = await statusStorage.getValue();
  await statusStorage.setValue({ ...status, logs: [...status.logs.slice(-50), entry] });
}

async function updateStatus(updates: Partial<ApplyStatus>) {
  const current = await statusStorage.getValue();
  await statusStorage.setValue({ ...current, ...updates });
}

const WAIT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

async function waitForState(targetState: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(false);
    }, WAIT_TIMEOUT_MS);

    const check = async () => {
      const status = await statusStorage.getValue();
      if (status.state === targetState) { clearTimeout(timeout); resolve(true); }
      else if (status.state === "idle") { clearTimeout(timeout); resolve(false); }
      else setTimeout(check, 500);
    };
    check();
  });
}

async function applyToJob(
  tabId: number, job: JobListing, profile: Record<string, unknown>,
  auth: { token: string; user: { name: string; email: string } }, sourceUrl: string
): Promise<{ success: boolean; error?: string }> {
  await addLog(log(`Applying to: ${job.title} at ${job.company}`));
  await updateStatus({ currentJob: job });

  try {
    const openResult = await browser.tabs.sendMessage(tabId, { type: "OPEN_APPLICATION", job });
    if (!openResult?.success) return { success: false, error: "Could not open application page" };

    await new Promise((r) => setTimeout(r, 2000));

    const wallCheck = await browser.tabs.sendMessage(tabId, { type: "CHECK_LOGIN_WALL" });
    if (wallCheck?.loginWall) {
      await addLog(log("Login required — please log in and click Resume", "warning"));
      await updateStatus({ state: "paused" });
      const resumed = await waitForState("running");
      if (!resumed) return { success: false, error: "Stopped by user" };
    }
    if (wallCheck?.captcha) {
      await addLog(log("CAPTCHA detected — please solve it and click Resume", "warning"));
      await updateStatus({ state: "paused" });
      const resumed = await waitForState("running");
      if (!resumed) return { success: false, error: "Stopped by user" };
    }

    const fieldsResult = await browser.tabs.sendMessage(tabId, { type: "EXTRACT_FIELDS" });
    if (!fieldsResult?.fields?.length) return { success: false, error: "No form fields found" };

    const mappingResult = await getFieldMappings({
      fields: fieldsResult.fields, user_profile: profile,
      user_name: auth.user.name, user_email: auth.user.email,
    });

    const screeningQuestions = fieldsResult.fields.filter(
      (f: { fieldType: string; fieldId: string }) =>
        (f.fieldType === "textarea" || f.fieldType === "radio" || f.fieldType === "select")
        && !mappingResult.mappings.find((m: { field_id: string }) => m.field_id === f.fieldId)
    );

    let screeningAnswers: Array<{ field_id: string; answer: string }> = [];
    if (screeningQuestions.length > 0) {
      const screeningResult = await getScreeningAnswers({
        job_title: job.title, company_name: job.company,
        job_description: job.description ?? "", questions: screeningQuestions, user_profile: profile,
      });
      screeningAnswers = screeningResult.answers ?? [];
    }

    const allAnswers = [
      ...mappingResult.mappings.map((m: { field_id: string; value: string }) => ({ field_id: m.field_id, value: m.value })),
      ...screeningAnswers.map((a) => ({ field_id: a.field_id, value: a.answer })),
    ];

    for (const answer of allAnswers) {
      await browser.tabs.sendMessage(tabId, { type: "FILL_FIELD", fieldId: answer.field_id, value: answer.value });
      await new Promise((r) => setTimeout(r, 300));
    }

    let submitted = false;
    for (let step = 0; step < 5; step++) {
      const result = await browser.tabs.sendMessage(tabId, { type: "CLICK_SUBMIT" });
      if (!result?.success) break;
      await new Promise((r) => setTimeout(r, 2000));
      const moreFields = await browser.tabs.sendMessage(tabId, { type: "EXTRACT_FIELDS" });
      if (!moreFields?.fields?.length) { submitted = true; break; }
    }

    return { success: submitted };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message) => {
    switch (message.type) {
      case "AUTH_CHECK": return await fetchExtensionToken();
      case "START": await startApplyLoop(message.url); break;
      case "PAUSE": await updateStatus({ state: "paused" }); await addLog(log("Paused", "warning")); break;
      case "RESUME": await updateStatus({ state: "running" }); await addLog(log("Resumed")); break;
      case "STOP": await updateStatus({ state: "idle", currentJob: null, queue: [] }); await addLog(log("Stopped", "warning")); break;
      case "SKIP": skipRequested = true; await addLog(log("Skipping...", "warning")); break;
    }
  });

  browser.runtime.onInstalled.addListener(async () => { await fetchExtensionToken(); });
});

async function startApplyLoop(url: string) {
  const authState = await authStorage.getValue();
  if (!authState) { await addLog(log("Not authenticated", "error")); return; }

  const profile = await getUserProfile();
  if (!profile) { await addLog(log("Could not fetch profile", "error")); return; }

  await updateStatus({ state: "running", completed: 0, failed: 0, dailyCount: authState.user.appsToday, dailyLimit: authState.user.dailyLimit, logs: [] });
  await addLog(log(`Starting — navigating to ${url}`));

  const tab = await browser.tabs.create({ url, active: true });
  if (!tab.id) { await addLog(log("Failed to open tab", "error")); await updateStatus({ state: "idle" }); return; }

  await new Promise((resolve) => {
    const listener = (tabId: number, info: { status?: string }) => {
      if (tabId === tab.id && info.status === "complete") { browser.tabs.onUpdated.removeListener(listener); resolve(true); }
    };
    browser.tabs.onUpdated.addListener(listener);
    setTimeout(() => resolve(false), 30000);
  });
  await new Promise((r) => setTimeout(r, 2000));

  await addLog(log("Scraping job listings..."));
  const scrapeResult = await browser.tabs.sendMessage(tab.id!, { type: "SCRAPE_LISTINGS" });

  if (scrapeResult?.error === "LOGIN_WALL") {
    await addLog(log("Login required — please log in", "warning"));
    await updateStatus({ state: "paused" });
    return;
  }

  if (!scrapeResult?.listings?.length) {
    await addLog(log("No job listings found", "error"));
    await updateStatus({ state: "idle" });
    return;
  }

  const listings: JobListing[] = scrapeResult.listings;
  await addLog(log(`Found ${listings.length} jobs`, "success"));
  await updateStatus({ queue: listings });

  for (let i = 0; i < listings.length; i++) {
    const status = await statusStorage.getValue();
    if (status.state === "idle") break;
    if (status.state === "paused") { const resumed = await waitForState("running"); if (!resumed) break; }
    if (status.dailyCount >= status.dailyLimit) { await addLog(log(`Daily limit reached (${status.dailyLimit})`, "warning")); break; }
    if (skipRequested) { skipRequested = false; await addLog(log(`Skipped: ${listings[i].title}`, "warning")); continue; }

    const job = listings[i];
    const result = await applyToJob(tab.id!, job, profile, authState, url);

    if (result.success) {
      await addLog(log(`Applied: ${job.title} at ${job.company}`, "success"));
      await updateStatus({ completed: status.completed + 1, dailyCount: status.dailyCount + 1, queue: listings.slice(i + 1) });
      try {
        await reportApplication({ job_url: job.applyUrl, company_name: job.company, job_title: job.title, job_description: job.description, status: "applied", source_url: url, platform: "linkedin" });
      } catch (err) {
        await addLog(log(`Failed to report application: ${err}`, "warning"));
      }
    } else {
      await addLog(log(`Failed: ${job.title} — ${result.error}`, "error"));
      await updateStatus({ failed: status.failed + 1, queue: listings.slice(i + 1) });
      try {
        await reportApplication({ job_url: job.applyUrl, company_name: job.company, job_title: job.title, status: "failed", failure_reason: result.error, source_url: url, platform: "linkedin" });
      } catch (err) {
        await addLog(log(`Failed to report application: ${err}`, "warning"));
      }
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  const finalStatus = await statusStorage.getValue();
  await addLog(log(`Done — ${finalStatus.completed} applied, ${finalStatus.failed} failed`, "success"));
  await updateStatus({ state: "idle", currentJob: null });
}

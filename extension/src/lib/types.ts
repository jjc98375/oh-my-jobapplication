export interface AuthState {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    dailyLimit: number;
    appsToday: number;
  };
}

export interface JobListing {
  title: string;
  company: string;
  applyUrl: string;
  description?: string;
}

export interface ApplyStatus {
  state: "idle" | "running" | "paused" | "stopped";
  currentJob: JobListing | null;
  queue: JobListing[];
  completed: number;
  failed: number;
  dailyCount: number;
  dailyLimit: number;
  logs: LogEntry[];
}

export interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

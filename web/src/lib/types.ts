// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      dailyLimit: number;
      appsToday: number;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    dailyLimit?: number;
    appsToday?: number;
  }
}

// Database types
export interface Profile {
  user_id: string;
  phone: string | null;
  location: string | null;
  work_experience: WorkExperience[];
  education: Education[];
  skills: string[];
  work_authorization: string | null;
  salary_expectation: SalaryExpectation | null;
  willing_to_relocate: boolean;
}

export interface WorkExperience {
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string | null;
  gpa: string | null;
}

export interface SalaryExpectation {
  min: number;
  max: number;
  currency: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_url: string;
  company_name: string | null;
  job_title: string | null;
  job_description: string | null;
  status: "applied" | "pending" | "failed" | "skipped";
  failure_reason: string | null;
  questions_answered: QuestionAnswer[];
  source_url: string | null;
  platform: "linkedin" | "indeed" | "jobright" | "other";
  applied_at: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  type: "profile" | "ai_generated";
}

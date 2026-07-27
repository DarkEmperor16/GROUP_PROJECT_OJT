export type QaLogStatus = "SUCCESS" | "FAILED" | "PROCESSING";

export interface QaLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "STUDENT" | "TEACHER" | "ADMIN";
  courseId: string;
  courseCode: string;
  courseName: string;
  question: string;
  answer: string;
  status: QaLogStatus;
  timestamp: string; // ISO format
  latencyMs?: number; // Response time in ms
  tokensUsed?: number; // Total LLM tokens used
  errorMessage?: string; // diagnostic message if status is FAILED
}

export interface QaListParams {
  search?: string; // search username or email
  role?: string; // STUDENT or TEACHER
  courseId?: string; // filter by course
  status?: string; // SUCCESS, FAILED, PROCESSING
  fromDate?: string; // start range ISO date
  toDate?: string; // end range ISO date
  page?: number;
  limit?: number;
}

export interface PaginatedQaLogs {
  data: QaLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

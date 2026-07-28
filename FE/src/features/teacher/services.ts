import apiClient from "@/lib/axios";

function buildQuery(params: object) {
  const searchParams = new URLSearchParams();

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export const teacherService = {
  listCourses(params: { status?: string } = {}) {
    return apiClient.get(`/teacher/courses${buildQuery(params)}`) as Promise<{
      courses: Array<{
        id: string;
        name: string;
        title?: string;
        code: string;
        description?: string;
        status: "ACTIVE" | "INACTIVE";
        createdAt: string;
        updatedAt: string;
      }>;
    }>;
  },

  listCoursesPaged(
    params: {
      status?: string;
      keyword?: string;
      sortBy?: "name" | "code" | "createdAt" | "updatedAt";
      sortOrder?: "asc" | "desc";
      page?: number;
      limit?: number;
    } = {},
  ) {
    return apiClient.get(`/teacher/courses${buildQuery(params)}`) as Promise<{
      courses: Array<{
        id: string;
        name: string;
        title?: string;
        code: string;
        description?: string;
        status: "ACTIVE" | "INACTIVE";
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>;
  },

  createCourse(payload: { name: string; code: string; description?: string }) {
    return apiClient.post('/teacher/courses', payload) as Promise<{
      message: string;
      course: {
        id: string;
        name: string;
        title?: string;
        code: string;
        description?: string;
        status: "ACTIVE" | "INACTIVE";
        createdAt: string;
        updatedAt: string;
      };
    }>;
  },

  updateCourse(
    courseId: string,
    payload: { name?: string; code?: string; description?: string; status?: "ACTIVE" | "INACTIVE" },
  ) {
    return apiClient.patch(`/teacher/courses/${courseId}`, payload) as Promise<{
      message: string;
      course: {
        id: string;
        name: string;
        title?: string;
        code: string;
        description?: string;
        status: "ACTIVE" | "INACTIVE";
        createdAt: string;
        updatedAt: string;
      };
    }>;
  },

  deleteCourse(courseId: string) {
    return apiClient.delete(`/teacher/courses/${courseId}`) as Promise<{
      message: string;
      deletedCourseId: string;
    }>;
  },

  getCourseDetail(courseId: string) {
    return apiClient.get(`/teacher/courses/${courseId}`) as Promise<{
      course: {
        id: string;
        name: string;
        code: string;
        status: "ACTIVE" | "INACTIVE";
      };
    }>;
  },

  getCourseInsights(courseId: string) {
    return apiClient.get(`/teacher/courses/${courseId}/insights`) as Promise<{
      course: {
        id: string;
        name: string;
        title?: string;
        code: string;
        description?: string;
        status: "ACTIVE" | "INACTIVE";
        createdAt: string;
        updatedAt: string;
      };
      summary: {
        studentCount: number;
        quizCount: number;
        documentCount: number;
        quizSessionCount: number;
      };
      students: Array<{
        id: string;
        fullName: string;
        email: string;
        status: "ACTIVE" | "INACTIVE";
        enrolledAt: string;
      }>;
      quizzes: Array<{
        id: string;
        title: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        timeLimit: number;
        questionCount: number;
        updatedAt: string;
        createdAt: string;
      }>;
      documents: Array<{
        id: string;
        title: string;
        version: string;
        fileName: string;
        status: "uploaded" | "processing" | "active" | "failed" | "inactive";
        size: number;
        aiErrorMessage?: string | null;
        indexedAt?: string | null;
        updatedAt: string;
        createdAt: string;
      }>;
      quizSessions: Array<{
        id: string;
        courseId: string;
        quizId?: string | null;
        quizTitle?: string | null;
        studentId: string;
        studentName: string;
        studentEmail?: string;
        status: "STARTED" | "COMPLETED" | "ABANDONED";
        score: number | null;
        totalQuestions?: number | null;
        percentage?: number | null;
        startedAt: string;
        completedAt?: string | null;
        gradedAt?: string | null;
      }>;
    }>;
  },

  updateQuizSessionScore(courseId: string, sessionId: string, score: number) {
    return apiClient.patch(`/teacher/courses/${courseId}/quiz-sessions/${sessionId}/score`, { score }) as Promise<{
      message: string;
      quizSession: {
        id: string;
        courseId: string;
        quizId?: string | null;
        studentId: string;
        status: "STARTED" | "COMPLETED" | "ABANDONED";
        score: number | null;
        totalQuestions?: number | null;
        percentage?: number | null;
        gradedAt?: string | null;
        updatedAt: string;
      };
    }>;
  },

  uploadDocument(courseId: string, payload: FormData) {
    return apiClient.post(`/teacher/courses/${courseId}/documents`, payload) as Promise<{
      message: string;
      document: TeacherDocument;
    }>;
  },

  listCourseDocuments(courseId: string, params: { status?: string } = {}) {
    return apiClient.get(`/teacher/courses/${courseId}/documents${buildQuery(params)}`) as Promise<{
      documents: TeacherDocument[];
    }>;
  },

  getDocumentDetail(documentId: string) {
    return apiClient.get(`/teacher/documents/${documentId}`) as Promise<{
      document: TeacherDocument;
    }>;
  },

  reindexDocument(documentId: string) {
    return apiClient.post(`/teacher/documents/${documentId}/reindex`) as Promise<{
      message: string;
      document: TeacherDocument;
    }>;
  },

  updateDocumentStatus(documentId: string, status: "active" | "inactive") {
    return apiClient.patch(`/teacher/documents/${documentId}/status`, { status }) as Promise<{
      message: string;
      document: TeacherDocument;
    }>;
  },

  updateDocumentMetadata(documentId: string, payload: { title?: string; version?: string; description?: string }) {
    return apiClient.patch(`/teacher/documents/${documentId}`, payload) as Promise<{
      message: string;
      document: TeacherDocument;
    }>;
  },

  deleteDocument(documentId: string) {
    return apiClient.delete(`/teacher/documents/${documentId}`) as Promise<{
      message: string;
      deletedDocumentId: string;
    }>;
  },

  getFeedbackSummary(courseId: string, params: TeacherDateParams = {}) {
    return apiClient.get(
      `/teacher/courses/${courseId}/feedback/summary${buildQuery(params)}`,
    ) as Promise<{
      summary: {
        totalFeedback: number;
        helpfulCount: number;
        notHelpfulCount: number;
        helpfulRate: number;
        answersWithFeedback: number;
        lowRatedAnswers: number;
      };
    }>;
  },

  getLowRatedAnswers(courseId: string, params: TeacherDateParams & TeacherPaginationParams = {}) {
    return apiClient.get(
      `/teacher/courses/${courseId}/answers/low-rated${buildQuery(params)}`,
    ) as Promise<{
      items: TeacherLowRatedAnswer[];
      pagination: TeacherPagination;
    }>;
  },

  updateAnswerReviewStatus(
    answerId: string,
    payload: { reviewStatus: "NEEDS_REVIEW" | "IN_PROGRESS" | "RESOLVED"; teacherReviewNote?: string },
  ) {
    return apiClient.patch(`/teacher/answers/${answerId}/review-status`, payload) as Promise<{
      message: string;
      answer: {
        id: string;
        reviewStatus: string;
        teacherReviewNote: string;
      };
    }>;
  },

  getHistoryList(
    params: TeacherDateParams &
      TeacherPaginationParams & {
        courseId?: string;
        keyword?: string;
        aiStatus?: string;
        reviewStatus?: string;
        confidenceStatus?: string;
        hasFeedback?: boolean;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      } = {},
  ) {
    return apiClient.get(`/teacher/history/qa${buildQuery(params)}`) as Promise<{
      items: Array<Record<string, unknown>>;
      pagination: TeacherPagination;
    }>;
  },

  getHistoryDetail(qaRecordId: string) {
    return apiClient.get(`/teacher/history/qa/${qaRecordId}`) as Promise<Record<string, unknown>>;
  },

  getPopularHistoryQuestions(
    params: TeacherDateParams & { courseId?: string; keyword?: string; limit?: number } = {},
  ) {
    return apiClient.get(`/teacher/history/qa/popular${buildQuery(params)}`) as Promise<{
      items: Array<Record<string, unknown>>;
    }>;
  },

  getDashboardOverview(params: TeacherDateParams & { courseId: string }) {
    return apiClient.get(`/teacher/dashboard/overview${buildQuery(params)}`) as Promise<{
      overview: {
        totalQuestions: number;
        totalStudents: number;
        totalFeedback: number;
        helpfulCount: number;
        notHelpfulCount: number;
        helpfulRate: number;
        answersNeedReviewCount: number;
      };
    }>;
  },

  getAiUsageSummary(params: TeacherDateParams & { courseId: string }) {
    return apiClient.get(`/teacher/dashboard/ai-usage-summary${buildQuery(params)}`) as Promise<{
      summary: {
        totalAiUsers: number;
        studentsAsked: number;
        questionCount: number;
        quizSessionCount: number;
      };
    }>;
  },

  getAiUsageTrends(
    params: TeacherDateParams & { courseId: string; groupBy?: "day" | "week" } = { courseId: "" },
  ) {
    return apiClient.get(`/teacher/dashboard/ai-usage-trends${buildQuery(params)}`) as Promise<{
      items: Array<{
        period: string;
        studentsAsked: number;
        questionCount: number;
        quizSessionCount: number;
        quizStudentsCount: number;
        totalAiUsers: number;
      }>;
    }>;
  },

  getHelpfulFeedbackSummary(params: TeacherDateParams & { courseId: string }) {
    return apiClient.get(
      `/teacher/dashboard/helpful-feedback-summary${buildQuery(params)}`,
    ) as Promise<{
      summary: {
        usefulFeedback: number;
        totalFeedback: number;
        helpfulCount: number;
        notHelpfulCount: number;
        helpfulRate: number;
        notHelpfulRate: number;
      };
    }>;
  },

  getHelpfulFeedbackTrends(
    params: TeacherDateParams & { courseId: string; groupBy?: "day" | "week" } = { courseId: "" },
  ) {
    return apiClient.get(
      `/teacher/dashboard/helpful-feedback-trends${buildQuery(params)}`,
    ) as Promise<{
      items: Array<{
        period: string;
        totalFeedback: number;
        helpfulCount: number;
        notHelpfulCount: number;
        helpfulRate: number;
        notHelpfulRate: number;
      }>;
    }>;
  },

  getDashboardPopularQuestions(
    params: TeacherDateParams & { courseId: string; keyword?: string; limit?: number },
  ) {
    return apiClient.get(`/teacher/dashboard/popular-questions${buildQuery(params)}`) as Promise<{
      items: Array<{
        question: string;
        askedCount: number;
        helpfulRate: number;
        courseName?: string;
      }>;
    }>;
  },

  getLearningTrends(
    params: TeacherDateParams & { courseId: string; groupBy?: "day" | "week" } = { courseId: "" },
  ) {
    return apiClient.get(`/teacher/dashboard/learning-trends${buildQuery(params)}`) as Promise<{
      items: Array<{
        period: string;
        totalQuestions: number;
        totalStudents: number;
        totalFeedback: number;
        helpfulCount: number;
        helpfulRate: number;
      }>;
    }>;
  },

  getAnswersNeedReview(courseId: string, params: TeacherDateParams & TeacherPaginationParams = {}) {
    return apiClient.get(
      `/teacher/dashboard/answers-need-review${buildQuery({ courseId, ...params })}`,
    ) as Promise<{
      items: TeacherLowRatedAnswer[];
      pagination: TeacherPagination;
    }>;
  },

  listQuizQuestions(
    params: TeacherPaginationParams & {
      courseId: string;
      reviewStatus?: string;
      questionType?: string;
      keyword?: string;
    },
  ) {
    return apiClient.get(`/teacher/quiz-questions${buildQuery(params)}`) as Promise<{
      items: TeacherQuizQuestion[];
      pagination: TeacherPagination;
    }>;
  },

  getQuizQuestionDetail(questionId: string) {
    return apiClient.get(`/teacher/quiz-questions/${questionId}`) as Promise<{
      quizQuestion: TeacherQuizQuestionDetail;
      feedbackSummary: {
        total: number;
        helpfulCount: number;
        notHelpfulCount: number;
        helpfulRate: number;
      };
      feedbacks: Array<Record<string, unknown>>;
    }>;
  },

  reviewQuizQuestion(
    questionId: string,
    payload: { reviewStatus: "GOOD" | "NEEDS_REVIEW"; teacherReviewNote?: string },
  ) {
    return apiClient.patch(`/teacher/quiz-questions/${questionId}/review`, payload) as Promise<{
      message: string;
      quizQuestion: {
        id: string;
        reviewStatus: string;
        teacherReviewNote: string;
      };
    }>;
  },

  createQuiz(payload: {
    courseId: string;
    title: string;
    timeLimit?: number;
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    questions: Array<{
      text: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>;
  }) {
    return apiClient.post('/teacher/quizzes', payload) as Promise<{
      message: string;
      quiz: {
        id: string;
        title: string;
        courseId: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        timeLimit: number;
        questionCount: number;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  },

  listTeacherQuizzes(
    params: {
      courseId?: string;
      status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
      keyword?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return apiClient.get(`/teacher/quizzes${buildQuery(params)}`) as Promise<{
      filters: {
        courseId: string | null;
        status: string | null;
        keyword: string | null;
        page: number;
        limit: number;
      };
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      quizzes: Array<{
        id: string;
        title: string;
        courseId: string;
        courseCode?: string;
        courseName?: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        timeLimit: number;
        questionCount: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>;
  },

  getTeacherQuizDetail(quizId: string) {
    return apiClient.get(`/teacher/quizzes/${quizId}`) as Promise<{
      quiz: {
        id: string;
        title: string;
        courseId: string;
        courseCode?: string;
        courseName?: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        timeLimit: number;
        questions: Array<{
          id?: string;
          text: string;
          options: string[];
          correctAnswer: number;
          explanation?: string;
        }>;
        questionCount: number;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  },

  updateQuiz(
    quizId: string,
    payload: {
      title?: string;
      timeLimit?: number;
      status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
      questions?: Array<{
        text: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
      }>;
    },
  ) {
    return apiClient.patch(`/teacher/quizzes/${quizId}`, payload) as Promise<{
      message: string;
      quiz: {
        id: string;
        title: string;
        courseId: string;
        status: "DRAFT" | "ACTIVE" | "ARCHIVED";
        timeLimit: number;
        questionCount: number;
        createdAt: string;
        updatedAt: string;
      };
    }>;
  },

  deleteQuiz(quizId: string) {
    return apiClient.delete(`/teacher/quizzes/${quizId}`) as Promise<{
      message: string;
      deletedQuizId: string;
    }>;
  },

  getProfile() {
    return apiClient.get('/teacher/profile') as Promise<{
      id: string;
      fullName: string;
      email: string;
      title: string;
      major: string;
      teacherId: string;
      photoUrl: string;
      mfaEnabled: boolean;
      role: string;
      status: string;
    }>;
  },

  updateProfile(payload: { fullName: string; email: string; title?: string; major?: string; photoUrl?: string }) {
    return apiClient.put('/teacher/profile', payload) as Promise<{
      message: string;
      profile: {
        id: string;
        fullName: string;
        email: string;
        title: string;
        major: string;
        teacherId: string;
        photoUrl: string;
        mfaEnabled: boolean;
      };
    }>;
  },

  updateMfa(enabled: boolean) {
    return apiClient.patch('/teacher/mfa', { enabled }) as Promise<{
      message: string;
      mfaEnabled: boolean;
    }>;
  },

  changePassword(payload: { oldPassword: string; newPassword: string }) {
    return apiClient.post('/teacher/change-password', payload) as Promise<{
      message: string;
    }>;
  },

  getAiStatus() {
    return apiClient.get('/teacher/ai-status') as Promise<{
      accuracy: number;
      lectureCount: number;
      monthlySupportCount: number;
    }>;
  },

  askAiChat(payload: { question: string; courseId?: string }) {
    return apiClient.post('/teacher/ai-chat', payload) as Promise<{
      question: string;
      answer: string;
      course: {
        id: string;
        code: string;
        name: string;
      };
      createdAt: string;
    }>;
  },
};

export interface TeacherDocument {
  id: string;
  courseId: string;
  title: string;
  version: string;
  description: string;
  fileName: string;
  size: number;
  status: "uploaded" | "processing" | "active" | "failed" | "inactive";
  aiErrorMessage?: string | null;
  indexedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherLowRatedAnswer {
  answerId: string;
  studentId: string;
  question: string;
  answer: string;
  confidenceStatus: string;
  reviewStatus: string;
  teacherReviewNote?: string;
  helpfulCount: number;
  notHelpfulCount: number;
  totalFeedback: number;
  helpfulRate: number;
  createdAt: string;
}

export interface TeacherQuizQuestion {
  id: string;
  courseId: string;
  questionType: string;
  questionContent: string;
  questionPreview: string;
  reviewStatus: string;
  teacherReviewNote?: string;
  feedbackSummary: {
    total: number;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeacherQuizQuestionDetail extends TeacherQuizQuestion {
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface TeacherDateParams {
  from?: string;
  to?: string;
}

interface TeacherPaginationParams {
  page?: number;
  limit?: number;
}

interface TeacherPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
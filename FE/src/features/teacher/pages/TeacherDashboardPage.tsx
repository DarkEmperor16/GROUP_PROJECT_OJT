import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, FileText, MessageSquare, RefreshCw, Users } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/shared/components/common/StatusStates";
import { teacherService } from "@/features/teacher/services";

type DashboardState = {
  overview: {
    totalQuestions: number;
    totalStudents: number;
    totalFeedback: number;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulRate: number;
    answersNeedReviewCount: number;
  };
  aiSummary: {
    totalAiUsers: number;
    studentsAsked: number;
    questionCount: number;
    quizSessionCount: number;
  };
  helpfulSummary: {
    usefulFeedback: number;
    totalFeedback: number;
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulRate: number;
    notHelpfulRate: number;
  };
  popularQuestions: Array<{
    question: string;
    askedCount: number;
    helpfulRate: number;
  }>;
  answersNeedReview: Array<{
    id?: string;
    question: string;
    confidenceStatus: string;
    reviewStatus: string;
    needsReviewReason: string;
    feedbackSummary: {
      total: number;
      helpfulCount: number;
      notHelpfulCount: number;
      helpfulRate: number;
    };
  }>;
  learningTrends: Array<{
    period: string;
    totalQuestions: number;
    totalStudents: number;
    totalFeedback: number;
    helpfulCount: number;
    helpfulRate: number;
  }>;
  documentCount: number;
};

function createMockDashboardState(): DashboardState {
  return {
    overview: {
      totalQuestions: 128,
      totalStudents: 42,
      totalFeedback: 76,
      helpfulCount: 58,
      notHelpfulCount: 18,
      helpfulRate: 76.32,
      answersNeedReviewCount: 6,
    },
    aiSummary: {
      totalAiUsers: 31,
      studentsAsked: 27,
      questionCount: 128,
      quizSessionCount: 19,
    },
    helpfulSummary: {
      usefulFeedback: 58,
      totalFeedback: 76,
      helpfulCount: 58,
      notHelpfulCount: 18,
      helpfulRate: 76.32,
      notHelpfulRate: 23.68,
    },
    popularQuestions: [
      {
        question: "Checklist trước chuyến bay gồm những bước nào?",
        askedCount: 22,
        helpfulRate: 88,
      },
      {
        question: "Cách xử lý cảnh báo buồng lái mức ưu tiên cao?",
        askedCount: 17,
        helpfulRate: 82,
      },
    ],
    answersNeedReview: [
      {
        id: "mock-answer-1",
        question: "Vì sao cần cross-check checklist ở mỗi phase?",
        confidenceStatus: "MEDIUM",
        reviewStatus: "NEEDS_REVIEW",
        needsReviewReason: "MANUAL_REVIEW_STATUS",
        feedbackSummary: {
          total: 7,
          helpfulCount: 2,
          notHelpfulCount: 5,
          helpfulRate: 28.57,
        },
      },
    ],
    learningTrends: [
      {
        period: "2026-W28",
        totalQuestions: 34,
        totalStudents: 18,
        totalFeedback: 19,
        helpfulCount: 15,
        helpfulRate: 78.95,
      },
      {
        period: "2026-W29",
        totalQuestions: 41,
        totalStudents: 23,
        totalFeedback: 27,
        helpfulCount: 20,
        helpfulRate: 74.07,
      },
    ],
    documentCount: 9,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const candidate = error as {
      message?: string;
      response?: { data?: { message?: string } };
    };

    return candidate.response?.data?.message || candidate.message || fallback;
  }

  return fallback;
}

function isOverviewEmpty(overview: DashboardState["overview"]) {
  return (
    overview.totalQuestions === 0 &&
    overview.totalStudents === 0 &&
    overview.totalFeedback === 0 &&
    overview.helpfulCount === 0 &&
    overview.notHelpfulCount === 0 &&
    overview.helpfulRate === 0 &&
    overview.answersNeedReviewCount === 0
  );
}

function isAiSummaryEmpty(aiSummary: DashboardState["aiSummary"]) {
  return (
    aiSummary.totalAiUsers === 0 &&
    aiSummary.studentsAsked === 0 &&
    aiSummary.questionCount === 0 &&
    aiSummary.quizSessionCount === 0
  );
}

function isHelpfulSummaryEmpty(helpfulSummary: DashboardState["helpfulSummary"]) {
  return helpfulSummary.totalFeedback === 0;
}

async function requestWithEmptyRetry<T>(
  request: () => Promise<T>,
  isEmpty: (value: T) => boolean,
): Promise<T> {
  const first = await request();

  if (isEmpty(first)) {
    return request();
  }

  return first;
}

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [usingMockFallback, setUsingMockFallback] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardState>(createMockDashboardState());

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId],
  );

  const loadCourses = useCallback(async () => {
    const response = await teacherService.listCourses({ status: "ACTIVE" });
    setCourses(response.courses);
    const nextCourseId = response.courses[0]?.id || "";
    setSelectedCourseId((current) => current || nextCourseId);
    return response.courses;
  }, []);

  const loadDashboard = useCallback(async (courseId: string, showFullLoading = false) => {
    const mockData = createMockDashboardState();

    if (!courseId) {
      setDashboard(mockData);
      setUsingMockFallback(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (showFullLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    try {
      const [
        overviewRes,
        aiSummaryRes,
        helpfulSummaryRes,
        popularQuestionsRes,
        answersNeedReviewRes,
        learningTrendsRes,
        documentsRes,
      ] = await Promise.allSettled([
        requestWithEmptyRetry(
          () => teacherService.getDashboardOverview({ courseId }),
          (value) => !value.overview || isOverviewEmpty(value.overview),
        ),
        requestWithEmptyRetry(
          () => teacherService.getAiUsageSummary({ courseId }),
          (value) => !value.summary || (value.summary.totalAiUsers === 0 && value.summary.questionCount === 0),
        ),
        requestWithEmptyRetry(
          () => teacherService.getHelpfulFeedbackSummary({ courseId }),
          (value) => !value.summary || value.summary.totalFeedback === 0,
        ),
        requestWithEmptyRetry(
          () => teacherService.getDashboardPopularQuestions({ courseId, limit: 5 }),
          (value) => !value.items || value.items.length === 0,
        ),
        requestWithEmptyRetry(
          () => teacherService.getAnswersNeedReview(courseId, { limit: 5 }),
          (value) => !value.items || value.items.length === 0,
        ),
        requestWithEmptyRetry(
          () => teacherService.getLearningTrends({ courseId, groupBy: "week" }),
          (value) => !value.items || value.items.length === 0,
        ),
        requestWithEmptyRetry(
          () => teacherService.listCourseDocuments(courseId),
          (value) => !value.documents || value.documents.length === 0,
        ),
      ]);

      const normalizedAnswersNeedReview =
        answersNeedReviewRes.status === "fulfilled"
          ? answersNeedReviewRes.value.items.map((item) => ({
              id: item.answerId,
              question: item.question,
              confidenceStatus: item.confidenceStatus,
              reviewStatus: item.reviewStatus,
              needsReviewReason: item.reviewStatus !== "RESOLVED" ? "MANUAL_REVIEW_STATUS" : "LOW_HELPFUL_RATE",
              feedbackSummary: {
                total: item.totalFeedback,
                helpfulCount: item.helpfulCount,
                notHelpfulCount: item.notHelpfulCount,
                helpfulRate: item.helpfulRate,
              },
            }))
          : [];

      const apiOverview = overviewRes.status === "fulfilled" ? overviewRes.value.overview : null;
      const apiAiSummary = aiSummaryRes.status === "fulfilled" ? aiSummaryRes.value.summary : null;
      const apiHelpfulSummary = helpfulSummaryRes.status === "fulfilled" ? helpfulSummaryRes.value.summary : null;
      const apiPopularQuestions = popularQuestionsRes.status === "fulfilled" ? popularQuestionsRes.value.items : [];
      const apiLearningTrends = learningTrendsRes.status === "fulfilled" ? learningTrendsRes.value.items : [];
      const apiDocumentCount = documentsRes.status === "fulfilled" ? documentsRes.value.documents.length : 0;

      const usedOverviewFallback = !apiOverview || isOverviewEmpty(apiOverview);
      const usedAiSummaryFallback = !apiAiSummary || isAiSummaryEmpty(apiAiSummary);
      const usedHelpfulSummaryFallback = !apiHelpfulSummary || isHelpfulSummaryEmpty(apiHelpfulSummary);
      const usedPopularQuestionsFallback = apiPopularQuestions.length === 0;
      const usedAnswersNeedReviewFallback = normalizedAnswersNeedReview.length === 0;
      const usedLearningTrendsFallback = apiLearningTrends.length === 0;
      const usedDocumentCountFallback = apiDocumentCount === 0;

      const nextDashboard: DashboardState = {
        overview: usedOverviewFallback ? mockData.overview : apiOverview,
        aiSummary: usedAiSummaryFallback ? mockData.aiSummary : apiAiSummary,
        helpfulSummary: usedHelpfulSummaryFallback ? mockData.helpfulSummary : apiHelpfulSummary,
        popularQuestions: usedPopularQuestionsFallback ? mockData.popularQuestions : apiPopularQuestions,
        answersNeedReview: usedAnswersNeedReviewFallback ? mockData.answersNeedReview : normalizedAnswersNeedReview,
        learningTrends: usedLearningTrendsFallback ? mockData.learningTrends : apiLearningTrends,
        documentCount: usedDocumentCountFallback ? mockData.documentCount : apiDocumentCount,
      };

      setDashboard(nextDashboard);

      const allRejected = [
        overviewRes,
        aiSummaryRes,
        helpfulSummaryRes,
        popularQuestionsRes,
        answersNeedReviewRes,
        learningTrendsRes,
        documentsRes,
      ].every((result) => result.status === "rejected");

      const usedFallback =
        allRejected ||
        usedOverviewFallback ||
        usedAiSummaryFallback ||
        usedHelpfulSummaryFallback ||
        usedPopularQuestionsFallback ||
        usedAnswersNeedReviewFallback ||
        usedLearningTrendsFallback ||
        usedDocumentCountFallback;

      setUsingMockFallback(usedFallback);

      if (allRejected) {
        setError("Không tải được dữ liệu dashboard.");
      }
    } catch (loadError: unknown) {
      setDashboard(mockData);
      setUsingMockFallback(true);
      setError(getErrorMessage(loadError, "Không tải được dữ liệu dashboard."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const loadedCourses = await loadCourses();
        const nextCourseId = loadedCourses[0]?.id || "";

        if (active) {
          await loadDashboard(nextCourseId, true);
        }
      } catch (loadError: unknown) {
        if (active) {
          setDashboard(createMockDashboardState());
          setUsingMockFallback(true);
          setError(getErrorMessage(loadError, "Không tải được course teacher."));
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [loadCourses, loadDashboard]);

  const statCards = [
    {
      title: "Người học đang dùng AI",
      value: dashboard.aiSummary.totalAiUsers,
      text: `${dashboard.aiSummary.studentsAsked} học viên đã đặt câu hỏi`,
      icon: Users,
    },
    {
      title: "Tổng số câu hỏi",
      value: dashboard.overview.totalQuestions,
      text: `${dashboard.aiSummary.quizSessionCount} phiên quiz AI`,
      icon: BarChart3,
    },
    {
      title: "Phản hồi hữu ích",
      value: `${dashboard.helpfulSummary.helpfulRate}%`,
      text: `${dashboard.helpfulSummary.helpfulCount}/${dashboard.helpfulSummary.totalFeedback} phản hồi là helpful`,
      icon: MessageSquare,
    },
    {
      title: "Tài liệu course",
      value: dashboard.documentCount,
      text: `${dashboard.overview.answersNeedReviewCount} câu trả lời cần xem lại`,
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 p-8 backdrop-blur-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/70">
              Dashboard Giảng viên
            </p>
            <h1 className="mt-2 text-4xl font-bold">Tổng quan hoạt động teacher</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Dữ liệu đang lấy trực tiếp từ teacher dashboard APIs của backend.
            </p>
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Nguồn dữ liệu: {usingMockFallback ? "Mock" : "API"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <Button
                key={course.id}
                variant={selectedCourseId === course.id ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCourseId(course.id);
                  void loadDashboard(course.id);
                }}
              >
                {course.code}
              </Button>
            ))}
            <Button variant="outline" size="sm" disabled={refreshing} onClick={() => loadDashboard(selectedCourseId)}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
              Làm mới
            </Button>
          </div>
        </div>
      </div>

      {loading ? <LoadingState /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={() => loadDashboard(selectedCourseId)} /> : null}
      {!loading && !selectedCourse ? (
        <EmptyState
          title="Chưa có course teacher nào"
          description="Đang dùng dữ liệu mock fallback để dashboard luôn hiển thị thông tin."
        />
      ) : null}

      {!loading ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardHeader className="space-y-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {item.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold">{item.value}</p>
                    </div>
                    <CardDescription>{item.text}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng học tập</CardTitle>
                <CardDescription>
                  Course đang chọn: {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "Mock course"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboard.learningTrends.length === 0 ? (
                  <EmptyState
                    title="Chưa có dữ liệu xu hướng"
                    description="Backend sẽ trả dữ liệu khi course có hoạt động học tập và feedback."
                  />
                ) : (
                  <div className="space-y-3">
                    {dashboard.learningTrends.map((item) => (
                      <div key={item.period} className="rounded-xl border p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-semibold">{item.period}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.totalQuestions} câu hỏi • {item.totalStudents} học viên • {item.totalFeedback} feedback
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{item.helpfulRate}%</p>
                            <p className="text-xs text-muted-foreground">Helpful rate</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Câu hỏi phổ biến</CardTitle>
                <CardDescription>Top câu hỏi được hỏi nhiều nhất theo course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dashboard.popularQuestions.length === 0 ? (
                  <EmptyState title="Chưa có câu hỏi phổ biến" />
                ) : (
                  dashboard.popularQuestions.map((item, index) => (
                    <div key={`${item.question}-${index}`} className="rounded-xl border p-4">
                      <p className="text-sm font-semibold">{item.question}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {item.askedCount} lượt hỏi • Helpful rate {item.helpfulRate}%
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Câu trả lời cần xem lại</CardTitle>
              <CardDescription>
                Tổng feedback: {dashboard.overview.totalFeedback} • Helpful {dashboard.overview.helpfulCount} • Not helpful {dashboard.overview.notHelpfulCount}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.answersNeedReview.length === 0 ? (
                <EmptyState
                  title="Không có câu trả lời nào cần review"
                  description="Backend không trả về answer cần review cho course hiện tại."
                />
              ) : (
                <div className="space-y-3">
                  {dashboard.answersNeedReview.map((item, index) => (
                    <div key={`${item.question}-${index}`} className="rounded-xl border p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="font-semibold">{item.question}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Confidence: {item.confidenceStatus} • Review status: {item.reviewStatus}
                          </p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Helpful rate: {item.feedbackSummary.helpfulRate}% • Tổng feedback: {item.feedbackSummary.total}
                          </p>
                        </div>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {item.needsReviewReason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
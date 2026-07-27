import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { teacherService } from "@/features/teacher/services";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/shared/components/common/StatusStates";
import { toast } from "sonner";

const COURSE_LIMIT = 10;
const QUIZ_LIMIT = 10;

const sortOptions = [
  { value: "updatedAt-desc", label: "Mới cập nhật" },
  { value: "name-asc", label: "Tên môn (A-Z)" },
  { value: "name-desc", label: "Tên môn (Z-A)" },
  { value: "code-asc", label: "Mã môn (A-Z)" },
  { value: "code-desc", label: "Mã môn (Z-A)" },
];

function buildSort(sortValue) {
  const [sortBy, sortOrder] = sortValue.split("-");
  return { sortBy, sortOrder };
}

function buildDefaultQuestion() {
  return {
    text: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  };
}

function buildInitialQuizForm() {
  return {
    title: "",
    status: "DRAFT",
    timeLimit: "0",
    questions: [buildDefaultQuestion()],
  };
}

export default function TeacherQuizCreationPage() {
  const [courses, setCourses] = useState([]);
  const [coursePagination, setCoursePagination] = useState({ total: 0, page: 1, limit: COURSE_LIMIT, totalPages: 1 });
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseError, setCourseError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [coursePage, setCoursePage] = useState(1);
  const [sortBy, setSortBy] = useState("updatedAt-desc");

  const [quizzes, setQuizzes] = useState([]);
  const [quizPagination, setQuizPagination] = useState({ total: 0, page: 1, limit: QUIZ_LIMIT, totalPages: 1 });
  const [quizPage, setQuizPage] = useState(1);
  const [quizStatusFilter, setQuizStatusFilter] = useState("ALL");
  const [quizKeyword, setQuizKeyword] = useState("");
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [quizActionId, setQuizActionId] = useState("");

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState("");
  const [loadingEditQuiz, setLoadingEditQuiz] = useState(false);
  const [modalCourseLabel, setModalCourseLabel] = useState("");
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState(buildInitialQuizForm());

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId],
  );

  const isEditing = Boolean(editingQuizId);

  const loadCourses = useCallback(async () => {
    setLoadingCourses(true);
    setCourseError("");

    try {
      const sort = buildSort(sortBy);
      const response = await teacherService.listCoursesPaged({
        page: coursePage,
        limit: COURSE_LIMIT,
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        keyword: keyword.trim() || undefined,
      });

      setCourses(response.courses || []);
      setCoursePagination(response.pagination || { total: 0, page: coursePage, limit: COURSE_LIMIT, totalPages: 1 });

      if (response.courses?.length > 0) {
        setSelectedCourseId((current) => {
          const exists = response.courses.some((course) => course.id === current);
          return exists ? current : response.courses[0].id;
        });
      } else {
        setSelectedCourseId("");
      }
    } catch (loadError) {
      setCourseError(loadError?.response?.data?.message || loadError?.message || "Không tải được danh sách môn học.");
      setCourses([]);
      setSelectedCourseId("");
    } finally {
      setLoadingCourses(false);
    }
  }, [coursePage, keyword, sortBy]);

  const loadQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    setQuizError("");

    try {
      const response = await teacherService.listTeacherQuizzes({
        page: quizPage,
        limit: QUIZ_LIMIT,
        courseId: selectedCourseId || undefined,
        status: quizStatusFilter === "ALL" ? undefined : quizStatusFilter,
        keyword: quizKeyword.trim() || undefined,
      });

      setQuizzes(response.quizzes || []);
      setQuizPagination(response.pagination || { total: 0, page: quizPage, limit: QUIZ_LIMIT, totalPages: 1 });
    } catch (loadError) {
      setQuizError(loadError?.response?.data?.message || loadError?.message || "Không tải được danh sách quiz.");
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  }, [quizPage, selectedCourseId, quizKeyword, quizStatusFilter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    setQuizPage(1);
  }, [selectedCourseId, quizStatusFilter]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleSearchCourses = () => {
    setCoursePage(1);
    loadCourses();
  };

  const handleSearchQuizzes = () => {
    setQuizPage(1);
    loadQuizzes();
  };

  const setQuestionField = (index, field, value) => {
    setQuizForm((current) => {
      const nextQuestions = [...current.questions];
      nextQuestions[index] = {
        ...nextQuestions[index],
        [field]: value,
      };

      return {
        ...current,
        questions: nextQuestions,
      };
    });
  };

  const setQuestionOption = (questionIndex, optionIndex, value) => {
    setQuizForm((current) => {
      const nextQuestions = [...current.questions];
      const nextOptions = [...nextQuestions[questionIndex].options];
      nextOptions[optionIndex] = value;
      nextQuestions[questionIndex] = {
        ...nextQuestions[questionIndex],
        options: nextOptions,
      };

      return {
        ...current,
        questions: nextQuestions,
      };
    });
  };

  const addQuestion = () => {
    setQuizForm((current) => ({
      ...current,
      questions: [...current.questions, buildDefaultQuestion()],
    }));
  };

  const removeQuestion = (index) => {
    setQuizForm((current) => {
      if (current.questions.length <= 1) {
        return current;
      }

      return {
        ...current,
        questions: current.questions.filter((_, questionIndex) => questionIndex !== index),
      };
    });
  };

  const openCreateModal = () => {
    if (!selectedCourseId) {
      toast.error("Vui lòng chọn môn học trước khi tạo quiz");
      return;
    }

    setEditingQuizId("");
    setModalCourseLabel(selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "");
    setQuizForm(buildInitialQuizForm());
    setIsQuizModalOpen(true);
  };

  const openEditModal = async (quiz) => {
    setQuizActionId(quiz.id);
    setLoadingEditQuiz(true);

    try {
      const response = await teacherService.getTeacherQuizDetail(quiz.id);
      const detail = response.quiz;

      setEditingQuizId(detail.id);
      setModalCourseLabel(
        [detail.courseCode, detail.courseName].filter(Boolean).join(" - ") || "Chưa rõ môn học",
      );
      setQuizForm({
        title: detail.title || "",
        status: detail.status || "DRAFT",
        timeLimit: String(detail.timeLimit ?? 0),
        questions:
          Array.isArray(detail.questions) && detail.questions.length > 0
            ? detail.questions.map((question) => ({
                text: question.text || "",
                options: Array.isArray(question.options) ? [...question.options] : ["", ""],
                correctAnswer: Number(question.correctAnswer ?? 0),
                explanation: question.explanation || "",
              }))
            : [buildDefaultQuestion()],
      });
      setIsQuizModalOpen(true);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Không tải được chi tiết quiz");
    } finally {
      setLoadingEditQuiz(false);
      setQuizActionId("");
    }
  };

  const validateQuestions = (questions) => {
    for (const question of questions) {
      if (!question.text) {
        return "Mỗi câu hỏi cần có nội dung";
      }

      const validOptions = question.options.filter(Boolean);
      if (validOptions.length < 2) {
        return "Mỗi câu hỏi cần ít nhất 2 đáp án";
      }

      if (
        !Number.isInteger(question.correctAnswer) ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
      ) {
        return "Vui lòng chọn đáp án đúng hợp lệ";
      }
    }

    return null;
  };

  const handleSaveQuiz = async () => {
    if (!isEditing && !selectedCourseId) {
      toast.error("Vui lòng chọn môn học trước khi lưu quiz");
      return;
    }

    if (!quizForm.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề quiz");
      return;
    }

    const normalizedQuestions = quizForm.questions.map((question) => ({
      text: question.text.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswer: Number(question.correctAnswer),
      explanation: question.explanation.trim(),
    }));

    const validationMessage = validateQuestions(normalizedQuestions);

    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSavingQuiz(true);

    try {
      const response = isEditing
        ? await teacherService.updateQuiz(editingQuizId, {
            title: quizForm.title.trim(),
            status: quizForm.status,
            timeLimit: Number(quizForm.timeLimit || 0),
            questions: normalizedQuestions,
          })
        : await teacherService.createQuiz({
            courseId: selectedCourseId,
            title: quizForm.title.trim(),
            status: quizForm.status,
            timeLimit: Number(quizForm.timeLimit || 0),
            questions: normalizedQuestions,
          });

      toast.success(response.message || (isEditing ? "Cập nhật quiz thành công" : "Tạo quiz thành công"));
      setIsQuizModalOpen(false);
      setEditingQuizId("");
      setModalCourseLabel("");
      setQuizForm(buildInitialQuizForm());
      await loadQuizzes();
    } catch (saveError) {
      toast.error(saveError?.response?.data?.message || saveError?.message || "Lưu quiz thất bại");
    } finally {
      setSavingQuiz(false);
    }
  };

  const handleToggleQuizStatus = async (quiz) => {
    const nextStatus = quiz.status === "ACTIVE" ? "DRAFT" : "ACTIVE";
    setQuizActionId(quiz.id);

    try {
      const response = await teacherService.updateQuiz(quiz.id, { status: nextStatus });
      toast.success(response.message || "Cập nhật trạng thái quiz thành công");
      await loadQuizzes();
    } catch (updateError) {
      toast.error(updateError?.response?.data?.message || updateError?.message || "Cập nhật trạng thái quiz thất bại");
    } finally {
      setQuizActionId("");
    }
  };

  const handleDeleteQuiz = async (quiz) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa quiz ${quiz.title}?`);
    if (!confirmed) return;

    setQuizActionId(quiz.id);

    try {
      const response = await teacherService.deleteQuiz(quiz.id);
      toast.success(response.message || "Xóa quiz thành công");
      await loadQuizzes();
    } catch (deleteError) {
      toast.error(deleteError?.response?.data?.message || deleteError?.message || "Xóa quiz thất bại");
    } finally {
      setQuizActionId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Giảng viên</p>
        <h1 className="text-3xl font-bold">Quản lý quiz theo môn học</h1>
        <p className="text-sm text-muted-foreground">Tạo quiz bằng pop-up, sửa/xóa/kích hoạt quiz và lọc theo môn học.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chọn môn học</CardTitle>
          <CardDescription>Tối đa {COURSE_LIMIT} môn học mỗi trang</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo tên môn / mã môn"
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setCoursePage(1);
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={handleSearchCourses}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Lọc môn
            </Button>
          </div>

          {loadingCourses ? <LoadingState /> : null}
          {!loadingCourses && courseError ? <ErrorState message={courseError} onRetry={loadCourses} /> : null}
          {!loadingCourses && !courseError && courses.length === 0 ? (
            <EmptyState title="Không có môn học" description="Giảng viên chưa có môn học phù hợp bộ lọc." />
          ) : null}

          {!loadingCourses && !courseError && courses.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-2">
                {courses.map((course) => (
                  <Button
                    key={course.id}
                    variant={selectedCourseId === course.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    {course.code} - {course.name}
                  </Button>
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                <span>
                  Trang {coursePagination.page}/{coursePagination.totalPages} - {coursePagination.total} môn học
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={coursePagination.page <= 1}
                    onClick={() => setCoursePage((current) => Math.max(1, current - 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={coursePagination.page >= coursePagination.totalPages}
                    onClick={() => setCoursePage((current) => Math.min(coursePagination.totalPages, current + 1))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Danh sách quiz</CardTitle>
              <CardDescription>
                Lọc theo môn học: {selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "Tất cả môn"}
              </CardDescription>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo quiz
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={quizKeyword}
              onChange={(event) => setQuizKeyword(event.target.value)}
              placeholder="Tìm theo tiêu đề quiz"
            />
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={quizStatusFilter}
              onChange={(event) => setQuizStatusFilter(event.target.value)}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
            <Button variant="outline" onClick={handleSearchQuizzes}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Lọc quiz
            </Button>
          </div>

          {loadingQuizzes ? <LoadingState /> : null}
          {!loadingQuizzes && quizError ? <ErrorState message={quizError} onRetry={loadQuizzes} /> : null}
          {!loadingQuizzes && !quizError && quizzes.length === 0 ? (
            <EmptyState title="Chưa có quiz" description="Tạo quiz mới bằng nút ở trên." />
          ) : null}

          {!loadingQuizzes && !quizError && quizzes.length > 0 ? (
            <>
              <div className="space-y-3">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="font-semibold">{quiz.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {quiz.courseCode} - {quiz.courseName} • {quiz.questionCount} câu hỏi • {quiz.timeLimit} phút
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">Trạng thái: {quiz.status}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={quizActionId === quiz.id || loadingEditQuiz}
                          onClick={() => openEditModal(quiz)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Sửa
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={quizActionId === quiz.id}
                          onClick={() => handleToggleQuizStatus(quiz)}
                        >
                          {quiz.status === "ACTIVE" ? "Tạm ngưng" : "Kích hoạt"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={quizActionId === quiz.id}
                          onClick={() => handleDeleteQuiz(quiz)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-sm text-muted-foreground">
                <span>
                  Trang {quizPagination.page}/{quizPagination.totalPages} - {quizPagination.total} quiz
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={quizPagination.page <= 1}
                    onClick={() => setQuizPage((current) => Math.max(1, current - 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={quizPagination.page >= quizPagination.totalPages}
                    onClick={() => setQuizPage((current) => Math.min(quizPagination.totalPages, current + 1))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {isQuizModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
            <CardHeader>
              <CardTitle>{isEditing ? "Sửa quiz" : "Tạo quiz mới"}</CardTitle>
              <CardDescription>
                Môn học đang chọn: {modalCourseLabel || (selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : "Chưa chọn")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Tiêu đề quiz</label>
                  <Input
                    value={quizForm.title}
                    onChange={(event) =>
                      setQuizForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Ví dụ: Quiz an toàn hàng không tuần 1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Thời gian (phút)</label>
                  <Input
                    type="number"
                    min="0"
                    value={quizForm.timeLimit}
                    onChange={(event) =>
                      setQuizForm((current) => ({ ...current, timeLimit: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Trạng thái</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-60"
                  value={quizForm.status}
                  onChange={(event) =>
                    setQuizForm((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Danh sách câu hỏi</h3>
                  <Button variant="outline" size="sm" onClick={addQuestion}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm câu hỏi
                  </Button>
                </div>

                {quizForm.questions.map((question, questionIndex) => (
                  <Card key={`question-${questionIndex}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Câu hỏi {questionIndex + 1}</CardTitle>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={quizForm.questions.length <= 1}
                          onClick={() => removeQuestion(questionIndex)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Nội dung câu hỏi</label>
                        <Input
                          value={question.text}
                          onChange={(event) => setQuestionField(questionIndex, "text", event.target.value)}
                          placeholder="Nhập nội dung câu hỏi"
                        />
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={`question-${questionIndex}-option-${optionIndex}`}>
                            <label className="mb-2 block text-sm font-medium">Đáp án {optionIndex + 1}</label>
                            <Input
                              value={option}
                              onChange={(event) => setQuestionOption(questionIndex, optionIndex, event.target.value)}
                              placeholder={`Nhập đáp án ${optionIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Đáp án đúng</label>
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={question.correctAnswer}
                            onChange={(event) => setQuestionField(questionIndex, "correctAnswer", Number(event.target.value))}
                          >
                            {question.options.map((_, optionIndex) => (
                              <option key={`correct-${optionIndex}`} value={optionIndex}>
                                Đáp án {optionIndex + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Giải thích</label>
                          <Input
                            value={question.explanation}
                            onChange={(event) => setQuestionField(questionIndex, "explanation", event.target.value)}
                            placeholder="Giải thích đáp án (tùy chọn)"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsQuizModalOpen(false);
                    setEditingQuizId("");
                    setModalCourseLabel("");
                    setQuizForm(buildInitialQuizForm());
                  }}
                >
                  Hủy
                </Button>
                <Button
                  disabled={savingQuiz || loadingEditQuiz || (!isEditing && !selectedCourseId)}
                  isLoading={savingQuiz || loadingEditQuiz}
                  onClick={handleSaveQuiz}
                >
                  {isEditing ? "Lưu thay đổi" : "Tạo quiz"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

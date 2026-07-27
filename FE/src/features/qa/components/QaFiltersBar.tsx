import { useState, useEffect } from "react";
import { Search, Calendar, Filter, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useCoursesQuery } from "@/features/courses/hooks/useCourses";

export interface FilterState {
  search: string;
  role: string;
  courseId: string;
  status: string;
  timeRange: "all" | "today" | "7days" | "30days" | "custom";
  fromDate: string;
  toDate: string;
}

interface QaFiltersBarProps {
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export default function QaFiltersBar({ onChange, onReset }: QaFiltersBarProps) {
  const { data: courseRes } = useCoursesQuery({ limit: 100 });
  const courses = courseRes?.data ?? [];

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [timeRange, setTimeRange] = useState<FilterState["timeRange"]>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Notify parent on change
  useEffect(() => {
    let computedFromDate = "";
    let computedToDate = "";

    const now = new Date();

    if (timeRange === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      computedFromDate = todayStart.toISOString();
    } else if (timeRange === "7days") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      computedFromDate = sevenDaysAgo.toISOString();
    } else if (timeRange === "30days") {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      computedFromDate = thirtyDaysAgo.toISOString();
    } else if (timeRange === "custom") {
      if (fromDate) {
        computedFromDate = new Date(fromDate + "T00:00:00").toISOString();
      }
      if (toDate) {
        computedToDate = new Date(toDate + "T23:59:59").toISOString();
      }
    }

    onChange({
      search,
      role,
      courseId,
      status,
      timeRange,
      fromDate: computedFromDate,
      toDate: computedToDate,
    });
  }, [search, role, courseId, status, timeRange, fromDate, toDate]);

  const handleReset = () => {
    setSearch("");
    setRole("");
    setCourseId("");
    setStatus("");
    setTimeRange("all");
    setFromDate("");
    setToDate("");
    onReset();
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-soft backdrop-blur-md space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Filter className="h-4 w-4 text-primary" />
        Advanced Audit Filters
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
        {/* Search by user */}
        <div className="relative">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Search User
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/20 border-border/60 hover:bg-muted/30 focus:bg-background transition-all rounded-xl"
            />
          </div>
        </div>

        {/* Filter by Role */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            User Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-muted/30"
          >
            <option value="">All Role</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
          </select>
        </div>

        {/* Filter by Course */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Course Module
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-muted/30"
          >
            <option value="">All Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.courseCode} - {course.courseName}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Processing Status */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            AI Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-muted/30"
          >
            <option value="">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
            <option value="PROCESSING">PROCESSING</option>
          </select>
        </div>

        {/* Time Range Preset */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as FilterState["timeRange"])}
            className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-muted/30"
          >
            <option value="all">All Time</option>
            <option value="today"> Today</option>
            <option value="7days"> Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Custom Date Picker Inputs - Revealed when 'custom' is active */}
      {timeRange === "custom" && (
        <div className="flex flex-wrap items-end gap-4 p-4 rounded-xl bg-muted/10 border border-border/40 animate-in fade-in duration-200">
          <div className="w-full sm:w-auto">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="flex h-10 w-full sm:w-48 rounded-xl border border-border/60 bg-muted/20 pl-9 pr-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/30"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="flex h-10 w-full sm:w-48 rounded-xl border border-border/60 bg-muted/20 pl-9 pr-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/30"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="h-10 rounded-xl"
          >
            Clear Date
          </Button>
        </div>
      )}

      {/* Reset filters button if any filter is active */}
      {(search || role || courseId || status || timeRange !== "all") && (
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-lg"
          >
            <X className="mr-1 h-3 w-3" />
            Reset All Filter
          </Button>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useCoursesQuery } from "@/features/courses/hooks/useCourses";

export interface DocFilterState {
  search: string;
  courseId: string;
  fileType: string;
}

interface DocumentFiltersBarProps {
  filters: DocFilterState;
  onChange: (filters: DocFilterState) => void;
}

export default function DocumentFiltersBar({ filters, onChange }: DocumentFiltersBarProps) {
  const { data: courseRes } = useCoursesQuery({ limit: 100 });
  const courses = courseRes?.data ?? [];

  const [search, setSearch] = useState(filters.search);
  const [courseId, setCourseId] = useState(filters.courseId);
  const [fileType, setFileType] = useState(filters.fileType);

  useEffect(() => {
    onChange({ search, courseId, fileType });
  }, [search, courseId, fileType]);

  const handleReset = () => {
    setSearch("");
    setCourseId("");
    setFileType("");
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/85 p-5 shadow-soft backdrop-blur-md space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Filter className="h-4 w-4 text-primary" />
        Document Search & Filters
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Search */}
        <div className="relative">
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Search File or Uploader
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filename or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-muted/20 border-border/60 hover:bg-muted/30 focus:bg-background transition-all rounded-xl"
            />
          </div>
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

        {/* Filter by File Type */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Format (File Type)
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-muted/30"
          >
            <option value="">All Format</option>
            <option value="pdf">PDF Document (.pdf)</option>
            <option value="docx">Word Document (.docx)</option>
            <option value="pptx">PowerPoint Presentation (.pptx)</option>
            <option value="txt">Text File (.txt)</option>
          </select>
        </div>
      </div>

      {(search || courseId || fileType) && (
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-lg"
          >
            <X className="mr-1 h-3 w-3" />
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}

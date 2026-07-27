import { Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useUsersQuery } from "@/features/users/hooks/useUsers";
import type { CourseListParams, CourseStatus } from "../types";

const selectClassName =
  "h-11 rounded-xl border border-input/80 bg-muted/40 px-3 text-sm shadow-sm transition-all duration-200 hover:border-input hover:bg-background focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10";

interface CourseFiltersBarProps {
  filters: CourseListParams;
  onChange: (filters: CourseListParams) => void;
}

export default function CourseFiltersBar({
  filters,
  onChange,
}: CourseFiltersBarProps) {
  // Query all teachers to populate the teacher dropdown
  const teachersQuery = useUsersQuery({ role: "TEACHER", limit: 1000 });
  const teachers = teachersQuery.data?.data ?? [];

  const hasFilters =
    Boolean(filters.search?.trim()) ||
    Boolean(filters.teacherId) ||
    Boolean(filters.status);

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur-sm">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search by course code or course name..."
            className="pl-10"
            value={filters.search ?? ""}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value, page: 1 })
            }
          />
        </div>

        <select
          className={selectClassName}
          value={filters.teacherId ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              teacherId: e.target.value,
              page: 1,
            })
          }
          aria-label="Filter by teacher"
        >
          <option value="">All Teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.fullName}
            </option>
          ))}
        </select>

        <select
          className={selectClassName}
          value={filters.status ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as CourseStatus | "",
              page: 1,
            })
          }
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {hasFilters && (
        <div className="mt-3 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() =>
              onChange({
                search: "",
                teacherId: "",
                status: "",
                page: 1,
                limit: filters.limit ?? 10,
              })
            }
          >
            <X className="h-4 w-4" aria-hidden />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

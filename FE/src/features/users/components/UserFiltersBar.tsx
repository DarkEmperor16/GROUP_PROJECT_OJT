import { Search, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import type { UserRole } from "@/features/auth/types";
import type { UserListParams, UserStatus } from "@/features/users/types";

const selectClassName =
  "h-11 rounded-xl border border-input/80 bg-muted/40 px-3 text-sm shadow-sm transition-all duration-200 hover:border-input hover:bg-background focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10";

interface UserFiltersBarProps {
  filters: UserListParams;
  onChange: (filters: UserListParams) => void;
}

export default function UserFiltersBar({
  filters,
  onChange,
}: UserFiltersBarProps) {
  const hasFilters =
    Boolean(filters.search?.trim()) ||
    Boolean(filters.role) ||
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
            placeholder="Search by name, email, or user code..."
            className="pl-10"
            value={filters.search ?? ""}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value, page: 1 })
            }
          />
        </div>

        <select
          className={selectClassName}
          value={filters.role ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              role: e.target.value as UserRole | "",
              page: 1,
            })
          }
          aria-label="Filter by role"
        >
          <option value="">All Role</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          className={selectClassName}
          value={filters.status ?? ""}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as UserStatus | "",
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
                role: "",
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

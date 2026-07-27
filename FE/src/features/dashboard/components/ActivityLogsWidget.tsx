import { useState } from "react";
import { Search, Info, AlertTriangle, ShieldAlert, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { useAuditLogsQuery } from "../hooks/useDashboard";

const selectClassName =
  "h-11 rounded-xl border border-input/80 bg-muted/40 px-3 text-sm shadow-sm transition-all duration-200 hover:border-input hover:bg-background focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10";

export default function ActivityLogsWidget() {
  const { data: allLogs = [], isLoading } = useAuditLogsQuery();
  
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");

  // Extract unique action types for filter options
  const uniqueActions = Array.from(new Set(allLogs.map((log) => log.action)));

  const handleClearFilters = () => {
    setSearch("");
    setLevelFilter("");
    setActionFilter("");
  };

  const filteredLogs = allLogs.filter((log) => {
    // Search query matches User or Action or Details
    const matchSearch =
      search.trim() === "" ||
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    const matchLevel = levelFilter === "" || log.level === levelFilter;
    const matchAction = actionFilter === "" || log.action === actionFilter;

    return matchSearch && matchLevel && matchAction;
  });

  const hasFilters = search !== "" || levelFilter !== "" || actionFilter !== "";

  return (
    <div className="space-y-4">
      {/* Search & Filters bar */}
      <div className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft backdrop-blur-sm space-y-3">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Search user, action, or details..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className={selectClassName}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            aria-label="Filter by log severity"
          >
            <option value="">All severity levels</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>

          <select
            className={selectClassName}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by action type"
          >
            <option value="">All action types</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={handleClearFilters}
            >
              <X className="h-4 w-4" aria-hidden />
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">User Node</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Details Summary (Encrypted/Masked)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                      <span>Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No activity logs match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let levelBadge = "";
                  let LevelIcon = Info;

                  if (log.level === "INFO") {
                    levelBadge = "bg-blue-50 text-blue-700 ring-blue-600/10";
                    LevelIcon = Info;
                  } else if (log.level === "WARNING") {
                    levelBadge = "bg-amber-50 text-amber-800 ring-amber-600/10";
                    LevelIcon = AlertTriangle;
                  } else if (log.level === "ERROR") {
                    levelBadge = "bg-red-50 text-red-700 ring-red-600/10 animate-pulse";
                    LevelIcon = ShieldAlert;
                  }

                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-muted/10"
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${levelBadge}`}
                        >
                          <LevelIcon className="h-3 w-3 shrink-0" />
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground/90 whitespace-nowrap">
                        {log.user}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary/95 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground break-all max-w-sm">
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

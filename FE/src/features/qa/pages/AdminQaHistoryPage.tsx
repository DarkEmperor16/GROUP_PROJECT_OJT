import { useState } from "react";
import { Brain, ChevronLeft, ChevronRight, Download, RefreshCw, BarChart2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErrorState } from "@/shared/components/common/StatusStates";
import { useQaHistoryQuery } from "../hooks/useQa";
import { qaService } from "../services";
import { exportToCsv } from "../utils/export";
import type { QaLog, QaListParams } from "../types";
import QaFiltersBar, { type FilterState } from "../components/QaFiltersBar";
import QaTable from "../components/QaTable";
import QaDetailsModal from "../components/QaDetailsModal";
import { toast } from "sonner";

const DEFAULT_FILTERS: QaListParams = {
  search: "",
  role: "",
  courseId: "",
  status: "",
  fromDate: "",
  toDate: "",
  page: 1,
  limit: 10,
};

export default function AdminQaHistoryPage() {
  const [filters, setFilters] = useState<QaListParams>(DEFAULT_FILTERS);
  const [selectedLog, setSelectedLog] = useState<QaLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const qaQuery = useQaHistoryQuery(filters);
  const logs = qaQuery.data?.data ?? [];
  const meta = qaQuery.data?.meta;
  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  // Compute statistics from the visible logs on the current page
  const allLogsForStats = {
    total: logs.length,
    success: logs.filter((l) => l.status === "SUCCESS").length,
    failed: logs.filter((l) => l.status === "FAILED").length,
    processing: logs.filter((l) => l.status === "PROCESSING").length,
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters((prev) => ({
      ...prev,
      search: newFilters.search,
      role: newFilters.role,
      courseId: newFilters.courseId,
      status: newFilters.status,
      fromDate: newFilters.fromDate,
      toDate: newFilters.toDate,
      page: 1, // reset page to 1 when filters change
    }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleViewDetails = (log: QaLog) => {
    setSelectedLog(log);
    setModalOpen(true);
  };

  const handleExport = async () => {
    setExporting(true);
    const exportToast = toast.loading("Generating Q&A history report...");
    try {
      // Fetch all matching logs ignoring pagination limits
      const exportParams = {
        search: filters.search,
        role: filters.role,
        courseId: filters.courseId,
        status: filters.status,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      };
      const allMatchingLogs = await qaService.listAllForExport(exportParams);

      if (allMatchingLogs.length === 0) {
        toast.dismiss(exportToast);
        toast.warning("No records to export", {
          description: "Modify your filter selections and try again.",
        });
        return;
      }

      exportToCsv(allMatchingLogs);

      toast.dismiss(exportToast);
      toast.success("Export successful", {
        description: `Exported ${allMatchingLogs.length} audit logs.`,
      });
    } catch (err) {
      toast.dismiss(exportToast);
      toast.error("Failed to generate CSV export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Q&A History Audit Trail
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Inspect all system-wide AI conversation dialogues. Search student/teacher inquiries,
            apply semantic course filters, view detailed RAG latencies, and export logs.
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 shrink-0 rounded-xl"
          onClick={handleExport}
          disabled={exporting || total === 0}
        >
          <Download className="h-4 w-4" aria-hidden />
          Export Logs (CSV)
        </Button>
      </div>

      {/* Stats Widget Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total volume */}
        <Card className="border-border/60 bg-card/85 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <BarChart2 className="h-4 w-4 text-primary" />
              Total Inquiries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{allLogsForStats.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">matching active parameters</p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="border-border/60 bg-card/85 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {allLogsForStats.total > 0
                ? `${Math.round((allLogsForStats.success / allLogsForStats.total) * 100)}%`
                : "0%"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {allLogsForStats.success} successful executions
            </p>
          </CardContent>
        </Card>

        {/* Failures */}
        <Card className="border-border/60 bg-card/85 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Failed Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{allLogsForStats.failed}</p>
            <p className="mt-1 text-xs text-muted-foreground">RAG service timeout/sensor errors</p>
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="border-border/60 bg-card/85 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Brain className="h-4 w-4 text-amber-500 animate-pulse" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{allLogsForStats.processing}</p>
            <p className="mt-1 text-xs text-muted-foreground">active LLM context retrievals</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <QaFiltersBar onChange={handleFilterChange} onReset={handleResetFilters} />

      {/* Table & Error States */}
      {qaQuery.isError ? (
        <ErrorState
          message="Could not retrieve system Q&A logs. Please try again."
          onRetry={() => qaQuery.refetch()}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Showing {logs.length} of {total} historical logs
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => qaQuery.refetch()}
              disabled={qaQuery.isFetching}
              className="h-8 rounded-lg gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${qaQuery.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <QaTable
            logs={logs}
            isLoading={qaQuery.isLoading}
            onViewDetails={handleViewDetails}
          />
        </div>
      )}

      {/* Pagination Controls */}
      {meta && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row border-t border-border/40 pt-4">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({total} audit logs)
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-xl"
              disabled={page <= 1 || qaQuery.isFetching}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
              }
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-xl"
              disabled={page >= totalPages || qaQuery.isFetching}
              onClick={() =>
                setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))
              }
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      <QaDetailsModal
        open={modalOpen}
        log={selectedLog}
        onClose={() => {
          setModalOpen(false);
          setSelectedLog(null);
        }}
      />
    </div>
  );
}

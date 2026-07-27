import { useState } from "react";
import { Plus, FileText, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ErrorState } from "@/shared/components/common/StatusStates";
import { useAuthStore } from "@/features/auth/store";
import {
  useDocumentsQuery,
  useUploadDocumentMutation,
  useToggleDocumentActiveMutation,
  useDeleteDocumentMutation,
} from "../hooks/useDocuments";
import type { DocumentListParams } from "../types";
import DocumentFiltersBar, { type DocFilterState } from "../components/DocumentFiltersBar";
import DocumentUploadModal from "../components/DocumentUploadModal";
import DocumentTable from "../components/DocumentTable";

const DEFAULT_FILTERS: DocumentListParams = {
  search: "",
  courseId: "",
  fileType: "",
  page: 1,
  limit: 10,
};

export default function AdminDocumentsPage() {
  const [filters, setFilters] = useState<DocumentListParams>(DEFAULT_FILTERS);
  const [uploadOpen, setUploadOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const uploaderEmail = user?.email || "admin@academy.edu";

  const documentsQuery = useDocumentsQuery(filters);
  const uploadMutation = useUploadDocumentMutation();
  const toggleMutation = useToggleDocumentActiveMutation();
  const deleteMutation = useDeleteDocumentMutation();

  const documents = documentsQuery.data?.data ?? [];
  const meta = documentsQuery.data?.meta;
  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;

  // Local helper stats
  const stats = {
    total: documents.length,
    active: documents.filter((d) => d.isActive).length,
    inactive: documents.filter((d) => !d.isActive).length,
  };

  const handleFilterChange = (newFilters: DocFilterState) => {
    setFilters((prev) => ({
      ...prev,
      search: newFilters.search,
      courseId: newFilters.courseId,
      fileType: newFilters.fileType,
      page: 1, // reset page
    }));
  };

  const handleUploadSubmit = (payload: any) => {
    uploadMutation.mutate(
      { payload, email: uploaderEmail },
      {
        onSuccess: () => {
          setUploadOpen(false);
        },
      }
    );
  };

  const handleToggleActive = (id: string) => {
    toggleMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Document & Knowledge Management (SE-F4)
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Upload academy study materials (PDF, DOCX, PPTX, TXT) and control
            AI Service reference data via Active/Inactive status toggles.
          </p>
        </div>
        <Button
          size="lg"
          className="gap-2 shrink-0 rounded-xl"
          onClick={() => setUploadOpen(true)}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/85 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              Total Study Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              matching active search parameters
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              RAG Activated (Active)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.active}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              currently used by RAG LLM for answering queries
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Deactivated (Inactive)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stats.inactive}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              temporarily excluded from the AI knowledge base
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DocumentFiltersBar filters={filters as DocFilterState} onChange={handleFilterChange} />

      {/* Table */}
      {documentsQuery.isError ? (
        <ErrorState
          message="Could not retrieve document list. Please try again."
          onRetry={() => documentsQuery.refetch()}
        />
      ) : (
        <DocumentTable
          documents={documents}
          isLoading={documentsQuery.isLoading}
          isToggling={toggleMutation.isPending}
          isDeleting={deleteMutation.isPending}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {meta && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row border-t border-border/40 pt-4">
          <p className="text-sm text-muted-foreground">
            Showing page {page} of {totalPages} ({total} documents)
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 rounded-xl"
              disabled={page <= 1 || documentsQuery.isFetching}
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
              disabled={page >= totalPages || documentsQuery.isFetching}
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

      {/* Upload Modal */}
      <DocumentUploadModal
        open={uploadOpen}
        isSubmitting={uploadMutation.isPending}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUploadSubmit}
      />
    </div>
  );
}

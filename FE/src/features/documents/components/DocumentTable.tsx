import { Trash2, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { EmptyState } from "@/shared/components/common/StatusStates";
import type { CourseDocument } from "../types";

interface DocumentTableProps {
  documents: CourseDocument[];
  isLoading?: boolean;
  isToggling?: boolean;
  isDeleting?: boolean;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function DocumentTable({
  documents,
  isLoading,
  isToggling,
  isDeleting,
  onToggleActive,
  onDelete,
}: DocumentTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/80 shadow-soft">
        <TableSkeleton />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents found"
        description="Try adjusting your search filters or upload a new document for this course."
      />
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: CourseDocument["fileType"]) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />;
      case "docx":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "pptx":
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Document Name (File)</th>
              <th className="px-4 py-3">Course Module</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">File Size</th>
              <th className="px-4 py-3">Uploaded By</th>
              <th className="px-4 py-3">Upload Date</th>
              <th className="px-4 py-3">Knowledge Base (RAG)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className="transition-colors hover:bg-muted/20"
              >
                <td className="px-4 py-3 max-w-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">{getFileIcon(doc.fileType)}</div>
                    <div>
                      <p className="font-semibold text-foreground break-all line-clamp-2" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={doc.description}>
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-foreground/80">{doc.courseCode}</span>
                  <p className="text-xs text-muted-foreground line-clamp-1">{doc.courseName}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground/90 whitespace-nowrap">
                  v{doc.version}
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatBytes(doc.fileSize)}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs font-medium">
                  {doc.uploadedBy}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(doc.uploadedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => onToggleActive(doc.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                        doc.isActive ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          doc.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    {doc.isActive ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Inactive
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => {
                      if (confirm(`Are you sure you want to permanently delete "${doc.fileName}"?`)) {
                        onDelete(doc.id);
                      }
                    }}
                    className="hover:bg-destructive/10 hover:text-destructive rounded-lg h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

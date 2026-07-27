import { useState, useRef } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { useCoursesQuery } from "@/features/courses/hooks/useCourses";

interface DocumentUploadModalProps {
  open: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onUpload: (payload: {
    fileName: string;
    courseId: string;
    version: string;
    description: string;
    fileType: "pdf" | "docx" | "pptx" | "txt";
    fileSize: number;
  }) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ["pdf", "docx", "pptx", "txt"];

export default function DocumentUploadModal({
  open,
  isSubmitting,
  onClose,
  onUpload,
}: DocumentUploadModalProps) {
  const { data: courseRes } = useCoursesQuery({ limit: 100 });
  const courses = courseRes?.data?.filter((c) => c.status === "ACTIVE") ?? [];

  const [courseId, setCourseId] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      setValidationError("Only accepted file formats: PDF, DOCX, PPTX, TXT.");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setValidationError("File size exceeds the allowed limit (Maximum 10 MB).");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!courseId) {
      setValidationError("Please select a course module for this document.");
      return;
    }

    if (!selectedFile) {
      setValidationError("Please select or drag & drop a document to upload.");
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() as any;

    onUpload({
      fileName: selectedFile.name,
      courseId,
      version: version.trim() || "1.0.0",
      description: description.trim(),
      fileType: extension,
      fileSize: selectedFile.size,
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
        disabled={isSubmitting}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-panel motion-safe:animate-fade-up sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
              Document Management
            </p>
            <h2 id="upload-modal-title" className="mt-1 text-2xl font-bold tracking-tight">
              Upload Study Material (4.1)
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a new course manual to the RAG knowledge base.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Validation Alert */}
          {validationError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive leading-relaxed animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Select Course */}
          <div>
            <Label htmlFor="upload-course">Select Course *</Label>
            <select
              id="upload-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={isSubmitting}
              className="mt-1.5 flex h-11 w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/30 focus:bg-background"
            >
              <option value="">-- Choose Course Manual --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.courseCode} — {course.courseName}
                </option>
              ))}
            </select>
          </div>

          {/* Version Input */}
          <div>
            <Label htmlFor="upload-version">Document Version</Label>
            <Input
              id="upload-version"
              placeholder="e.g. 1.0.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              disabled={isSubmitting}
              className="mt-1.5 rounded-xl border-border/60 hover:bg-muted/20 focus:bg-background transition-all"
            />
          </div>

          {/* Description Input */}
          <div>
            <Label htmlFor="upload-desc">Brief Description</Label>
            <textarea
              id="upload-desc"
              rows={3}
              placeholder="Key concepts covered in this guide..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="mt-1.5 flex w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all border-input hover:border-input/80 focus:bg-background"
            />
          </div>

          {/* File Picker Zone */}
          <div>
            <Label>Select File *</Label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              className={`mt-1.5 border-2 border-dashed border-border/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-muted/10 hover:border-primary/40 ${
                selectedFile ? "bg-primary/5 border-primary/20" : "bg-muted/5"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx,.pptx,.txt"
                className="hidden"
                disabled={isSubmitting}
              />

              {selectedFile ? (
                <div className="space-y-2">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 inline-block text-primary">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground truncate max-w-xs">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Size: {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-muted/20 rounded-2xl inline-block text-muted-foreground border border-border/40">
                    <Upload className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Drag & Drop or Click to Browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOCX, PPTX, TXT files up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl shadow-soft"
              isLoading={isSubmitting}
            >
              Upload
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import type { QaLog } from "../types";

export function exportToCsv(logs: QaLog[], filename = "qa_history_audit.csv") {
  const headers = [
    "Log ID",
    "Timestamp",
    "User Name",
    "User Email",
    "User Role",
    "Course Code",
    "Course Name",
    "Question",
    "AI Answer",
    "Status",
    "Latency (ms)",
    "Tokens Used",
    "Error Message",
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return "";
    let str = String(val);
    str = str.replace(/"/g, '""');
    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str}"`;
    }
    return str;
  };

  const rows = logs.map((log) => [
    log.id,
    log.timestamp,
    log.userName,
    log.userEmail,
    log.userRole,
    log.courseCode,
    log.courseName,
    log.question,
    log.answer,
    log.status,
    log.latencyMs ?? "",
    log.tokensUsed ?? "",
    log.errorMessage ?? "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, FileText, Brain, LayoutDashboard, Eye } from "lucide-react";
import OverviewStatsWidget from "../components/OverviewStatsWidget";
import ServiceStatusWidget from "../components/ServiceStatusWidget";
import ActivityLogsWidget from "../components/ActivityLogsWidget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "analytics">("overview");

  const tabClass = (tabId: "overview" | "logs" | "analytics") => {
    const isActive = activeTab === tabId;
    return `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-primary text-white shadow-soft"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    }`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-primary">System Monitoring</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Real-time service indicators, operations metrics, and audit logs.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border/60 pb-3">
        <button onClick={() => setActiveTab("overview")} className={tabClass("overview")}>
          <LayoutDashboard className="h-4 w-4" />
          Overview & Health
        </button>
        <button onClick={() => setActiveTab("logs")} className={tabClass("logs")}>
          <Activity className="h-4 w-4" />
          System Activity Logs
        </button>
        <button onClick={() => setActiveTab("analytics")} className={tabClass("analytics")}>
          <Brain className="h-4 w-4" />
          Q&A Analytics
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats metrics */}
          <OverviewStatsWidget />

          {/* Service Status Monitoring */}
          <ServiceStatusWidget />
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-6">
          <ActivityLogsWidget />
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/60 bg-card/85 shadow-soft">
            <CardHeader>
              <Brain className="h-7 w-7 text-primary mb-2" />
              <CardTitle>AI Query Volume</CardTitle>
              <CardDescription>Simulated query frequency by subject manual</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border border-dashed border-border/60 rounded-2xl m-4 bg-muted/10">
              <div className="text-center text-muted-foreground space-y-1">
                <p className="font-semibold text-sm">Query Volume Graphs</p>
                <p className="text-xs">RAG integration statistics will display here (Coming soon - SE-F10)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/85 shadow-soft">
            <CardHeader>
              <FileText className="h-7 w-7 text-primary mb-2" />
              <CardTitle>Document Coverage</CardTitle>
              <CardDescription>Vector DB chunking and embedding metrics</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center border border-dashed border-border/60 rounded-2xl m-4 bg-muted/10">
              <div className="text-center text-muted-foreground space-y-1">
                <p className="font-semibold text-sm">Embedding Data Tables</p>
                <p className="text-xs">Database token count analytics (Coming soon - SE-F11)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/85 shadow-soft flex flex-col justify-between">
            <div>
              <CardHeader>
                <Brain className="h-7 w-7 text-secondary mb-2" />
                <CardTitle>Q&A History Audit Trail</CardTitle>
                <CardDescription>
                  Monitor and review system-wide AI consultation logs, processing latency, and token parameters.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-muted/20 border border-border/40 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Log Standard:</span>
                    <span className="font-semibold text-foreground">SE-F6.3 Compliant</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Audit logs state:</span>
                    <span className="inline-flex rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-semibold text-emerald-800">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </CardContent>
            </div>
            <div className="px-6 pb-6">
              <Button asChild className="w-full rounded-xl gap-2 shadow-soft">
                <Link to="/admin/qa">
                  <Eye className="h-4 w-4" />
                  View Q&A Audit Logs
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}


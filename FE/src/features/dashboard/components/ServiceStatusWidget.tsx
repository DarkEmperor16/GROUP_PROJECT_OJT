import { useState } from "react";
import { Server, Database, HardDrive, Cpu, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

interface ServiceState {
  name: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "PENDING";
  latency?: number | null;
  icon: any;
  recordedTimestamp?: string | null;
}

export default function ServiceStatusWidget() {
  const [aiFailed, setAiFailed] = useState(false);
  const [aiOutageTime, setAiOutageTime] = useState<string | null>(null);

  const handleToggleAiOutage = () => {
    if (!aiFailed) {
      setAiFailed(true);
      setAiOutageTime(new Date().toISOString());
    } else {
      setAiFailed(false);
      setAiOutageTime(null);
    }
  };

  // Latency data will come from BE health-check API — pending integration
  const services: ServiceState[] = [
    {
      name: "Backend Server Gateway",
      status: "PENDING",
      latency: null,
      icon: Server,
    },
    {
      name: "PostgreSQL Database Cluster",
      status: "PENDING",
      latency: null,
      icon: Database,
    },
    {
      name: "S3 Object File Storage",
      status: "PENDING",
      latency: null,
      icon: HardDrive,
    },
    {
      name: "Cognitive AI Service (RAG)",
      status: aiFailed ? "OFFLINE" : "PENDING",
      latency: null,
      icon: Cpu,
      recordedTimestamp: aiOutageTime,
    },
  ];

  return (
    <Card className="border-border/60 bg-card/85 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Service Health &amp; Operations Status</CardTitle>
          <CardDescription>Server latency and availability monitor — connect BE health-check API to populate</CardDescription>
        </div>
        <Button
          variant={aiFailed ? "default" : "destructive"}
          size="sm"
          className="rounded-xl transition-all"
          onClick={handleToggleAiOutage}
        >
          {aiFailed ? "Restore AI Service" : "Simulate AI Outage"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((svc) => {
            const Icon = svc.icon;
            const isOffline = svc.status === "OFFLINE";
            const isPending = svc.status === "PENDING";

            return (
              <div
                key={svc.name}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <div
                  className={`p-2.5 rounded-xl border ${
                    isOffline
                      ? "text-destructive bg-destructive/5 border-destructive/20 animate-pulse"
                      : isPending
                      ? "text-muted-foreground bg-muted/60 border-border/40"
                      : "text-emerald-600 bg-emerald-50 border-emerald-200/40"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground/90 truncate">
                      {svc.name}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                        isOffline
                          ? "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20"
                          : isPending
                          ? "bg-muted text-muted-foreground ring-1 ring-inset ring-border/40"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10"
                      }`}
                    >
                      {isOffline ? "OFFLINE" : isPending ? "PENDING" : "ONLINE"}
                    </span>
                  </div>
                  {isOffline ? (
                    <div className="mt-1 text-[11px] text-destructive space-y-0.5">
                      <p className="font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        AI Service unresponsive (503 Service Unavailable)
                      </p>
                      {svc.recordedTimestamp && (
                        <p className="text-muted-foreground text-[10px]">
                          Recorded: {new Date(svc.recordedTimestamp).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isPending ? "Awaiting BE health-check API" : `Latency: ${svc.latency}ms • API operational`}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

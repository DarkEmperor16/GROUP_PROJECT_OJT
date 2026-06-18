import { Settings, Shield, Users } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Manage users, roles, courses, and system activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Users className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>User Management</CardTitle>
            <CardDescription>Provision assigned accounts</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Settings className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>System Config</CardTitle>
            <CardDescription>Courses, documents, logs</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Shield className="h-8 w-8 text-primary" aria-hidden />
            <CardTitle>Security</CardTitle>
            <CardDescription>Access control & audit trail</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

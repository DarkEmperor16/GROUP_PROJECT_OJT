import { GraduationCap, Shield, ShieldCheck, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/features/auth/types";

type KnownRole = UserRole | string;

const roleConfig: Record<
  string,
  { label: string; icon: typeof GraduationCap; className: string }
> = {
  STUDENT: {
    label: "Student",
    icon: GraduationCap,
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  TEACHER: {
    label: "Teacher",
    icon: UserCog,
    className: "border-secondary/30 bg-secondary/10 text-secondary",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    className:
      "border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-300",
  },
};

export default function UserRoleBadge({ role }: { role: KnownRole }) {
  const config = roleConfig[role] ?? {
    label: role ?? "Unknown",
    icon: Shield,
    className: "border-border/60 bg-muted/40 text-muted-foreground",
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {config.label}
    </span>
  );
}

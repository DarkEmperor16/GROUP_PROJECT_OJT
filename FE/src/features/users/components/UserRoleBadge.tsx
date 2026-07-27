import { GraduationCap, Shield, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/features/auth/types";

const roleConfig: Record<
  UserRole,
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
    className: "border-violet-200/80 bg-violet-50 text-violet-800",
  },
};

export default function UserRoleBadge({ role }: { role: UserRole }) {
  const config = roleConfig[role];
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

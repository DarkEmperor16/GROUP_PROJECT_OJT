import { forwardRef, type HTMLAttributes } from "react";
import { GraduationCap, Shield, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/features/auth/types";

const roles: {
  value: UserRole;
  label: string;
  description: string;
  icon: typeof GraduationCap;
}[] = [
  {
    value: "STUDENT",
    label: "Student",
    description: "Learn & practice",
    icon: GraduationCap,
  },
  {
    value: "TEACHER",
    label: "Teacher",
    description: "Manage courses",
    icon: UserCog,
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "System admin",
    icon: Shield,
  },
];

interface RoleSelectorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

const RoleSelector = forwardRef<HTMLDivElement, RoleSelectorProps>(
  ({ value, onChange, disabled, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Sign in role"
        className={cn("grid grid-cols-1 gap-3 sm:grid-cols-3", className)}
        {...props}
      >
        {roles.map(({ value: roleValue, label, description, icon: Icon }) => {
          const selected = value === roleValue;

          return (
            <button
              key={roleValue}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(roleValue)}
              className={cn(
                "flex cursor-pointer flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                "disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-primary/40 bg-primary/10 shadow-sm ring-1 ring-primary/20"
                  : "border-border/80 bg-muted/30 hover:border-primary/25 hover:bg-background",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          );
        })}
      </div>
    );
  },
);
RoleSelector.displayName = "RoleSelector";

export default RoleSelector;

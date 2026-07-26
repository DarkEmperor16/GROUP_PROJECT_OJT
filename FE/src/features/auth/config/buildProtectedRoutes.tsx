import { createElement } from "react";
import type { RouteObject } from "react-router-dom";
import RoleGuard from "@/shared/components/common/RoleGuard";
import { ROLE_ROUTE_GROUPS } from "@/features/auth/config/roleRoutes";

/** Build protected child routes from role config (dynamic routing). */
export function buildProtectedRoleRoutes(): RouteObject[] {
  return ROLE_ROUTE_GROUPS.map((group) => ({
    element: createElement(RoleGuard, { allowedRoles: [group.role] }),
    children: group.routes.map(({ path, lazy }) => ({
      path,
      lazy,
    })),
  }));
}

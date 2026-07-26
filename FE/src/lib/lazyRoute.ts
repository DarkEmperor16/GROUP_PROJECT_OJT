import type { ComponentType } from "react";

type ModuleWithComponent = Record<string, ComponentType>;

/**
 * Helper for React Router `lazy` routes — code-split theo từng page.
 * @example lazyRoute(() => import("@/features/auth"), "LoginPage")
 */
export function lazyRoute<M extends ModuleWithComponent, K extends keyof M>(
  loader: () => Promise<M>,
  exportName: K,
) {
  return async () => {
    const module = await loader();
    const Component = module[exportName];

    if (!Component) {
      throw new Error(`lazyRoute: export "${String(exportName)}" not found`);
    }

    return { Component: Component as ComponentType };
  };
}

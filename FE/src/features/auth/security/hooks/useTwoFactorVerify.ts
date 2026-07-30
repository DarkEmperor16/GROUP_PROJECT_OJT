import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { parseAuthSecurityError } from "@/features/auth/security/parseAuthError";
import { twoFactorService } from "@/features/auth/security/services";
import type { TwoFactorVerifyRequest } from "@/features/auth/security/types";
import { ROLE_HOME_PATH } from "@/features/auth/types";
import { syncAuthSession } from "@/features/auth/utils/syncSession";

export function useTwoFactorVerifyMutation() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? null;

  return useMutation({
    mutationFn: (request: TwoFactorVerifyRequest) =>
      twoFactorService.verify(request),
    onSuccess: (data) => {
      syncAuthSession(queryClient, data);
      toast.success("Verification successful");
      navigate(from ?? ROLE_HOME_PATH[data.user.role], { replace: true });
    },
    onError: (error) => {
      const parsed = parseAuthSecurityError(error);
      toast.error(parsed.title, {
        description: parsed.description,
      });
    },
  });
}

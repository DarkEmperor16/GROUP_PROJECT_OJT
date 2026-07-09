import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { twoFactorService } from "@/features/auth/security/services";
import type { TwoFactorVerifyRequest } from "@/features/auth/security/types";
import { useAuthStore } from "@/features/auth/store";
import { ROLE_HOME_PATH } from "@/features/auth/types";
import { prefetchRoleRoutes } from "@/features/auth/utils/prefetchRoutes";

export function useTwoFactorVerifyMutation() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (request: TwoFactorVerifyRequest) =>
      twoFactorService.verify(request),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.refreshToken, data.user);
      prefetchRoleRoutes(data.user.role);
      toast.success("Verification successful");
      navigate(ROLE_HOME_PATH[data.user.role], { replace: true });
    },
    onError: () => {
      toast.error("Invalid verification code", {
        description: "Please try again or contact your administrator.",
      });
    },
  });
}

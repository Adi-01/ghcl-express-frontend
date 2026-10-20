import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  loginAction,
  logoutAction,
  revokeSessionAction,
  revokeAllSessionsAction,
  LoginInput,
} from "@/app/actions/auth.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isAuthRevocationError } from "@/lib/api/auth-error-handler";
import { ROUTES } from "@/lib/constants";

export function useLoginMutation() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await loginAction(input);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Logged in successfully");
      if (data?.user?.role === "ADMIN") {
        router.push(ROUTES.adminUsers);
      } else {
        router.push(ROUTES.profile);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to log in.");
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const res = await logoutAction();
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: (error: any) => {
      toast.error(error?.message || "Logout failed.");
    },
  });
}

export function useRevokeSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, sessionId }: { userId: string; sessionId: string }) => {
      const res = await revokeSessionAction(userId, sessionId);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "sessions"] });
      toast.success("Session revoked successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to revoke session.");
    },
  });
}

export function useRevokeAllSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await revokeAllSessionsAction(userId);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "sessions"] });
      toast.success("All user sessions revoked successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to revoke sessions.");
    },
  });
}


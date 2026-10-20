import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import {
  updateProfileAction,
  createBankDetailsAction,
  updateBankDetailsAction,
  deleteBankDetailsAction,
  UpdateProfileInput,
  BankDetailsInput,
} from "@/app/actions/profile.actions";
import { User, BankDetails } from "@/lib/types";
import { toast } from "sonner";
import { isAuthRevocationError } from "@/lib/api/auth-error-handler";

function formatErrorMessage(error: any, fallback: string): string {
  if (Array.isArray(error?.details) && error.details.length > 0) {
    return error.details
      .map((d: any) => d.message || `${d.field || "field"}: invalid`)
      .join(" • ");
  }
  return error?.message || fallback;
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const res = await updateProfileAction(input);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.profile.all });
      const previousData = queryClient.getQueriesData<User>({
        queryKey: QUERY_KEYS.profile.all,
      });

      queryClient.setQueriesData<User>(
        { queryKey: QUERY_KEYS.profile.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            ...input,
            updated_at: new Date().toISOString(),
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Profile updated successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, val]) => {
          queryClient.setQueryData(key, val);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(formatErrorMessage(error, "Failed to update profile."));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.all });
    },
  });
}

export function useCreateBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BankDetailsInput) => {
      const res = await createBankDetailsAction(input);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bankDetails.all });
      const previousData = queryClient.getQueriesData<BankDetails | null>({
        queryKey: QUERY_KEYS.bankDetails.all,
      });

      const optimisticBank: BankDetails = {
        id: "temp-" + Date.now(),
        account_holder_name: input.account_holder_name,
        account_number: input.account_number || "",
        ifsc_code: input.ifsc_code,
        bank_name: input.bank_name,
        branch_name: input.branch_name,
        account_type: input.account_type,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueriesData<BankDetails | null>(
        { queryKey: QUERY_KEYS.bankDetails.all },
        () => optimisticBank
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Bank details saved successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, val]) => {
          queryClient.setQueryData(key, val);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(formatErrorMessage(error, "Failed to save bank details."));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankDetails.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.all });
    },
  });
}

export function useUpdateBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BankDetailsInput) => {
      const res = await updateBankDetailsAction(input);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bankDetails.all });
      const previousData = queryClient.getQueriesData<BankDetails | null>({
        queryKey: QUERY_KEYS.bankDetails.all,
      });

      queryClient.setQueriesData<BankDetails | null>(
        { queryKey: QUERY_KEYS.bankDetails.all },
        (old) =>
          old
            ? {
                ...old,
                ...input,
                updated_at: new Date().toISOString(),
              }
            : old
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Bank details updated successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, val]) => {
          queryClient.setQueryData(key, val);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(formatErrorMessage(error, "Failed to update bank details."));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankDetails.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.all });
    },
  });
}

export function useDeleteBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await deleteBankDetailsAction();
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bankDetails.all });
      const previousData = queryClient.getQueriesData<BankDetails | null>({
        queryKey: QUERY_KEYS.bankDetails.all,
      });

      queryClient.setQueriesData<BankDetails | null>(
        { queryKey: QUERY_KEYS.bankDetails.all },
        () => null
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Bank details deleted successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([key, val]) => {
          queryClient.setQueryData(key, val);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete bank details.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bankDetails.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile.all });
    },
  });
}

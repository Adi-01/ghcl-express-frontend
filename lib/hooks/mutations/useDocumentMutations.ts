import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import {
  uploadDocumentAction,
  updateDocumentAction,
  deleteDocumentAction,
} from "@/app/actions/document.actions";
import { toast } from "sonner";
import { isAuthRevocationError } from "@/lib/api/auth-error-handler";

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await uploadDocumentAction(formData);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents.all });
      toast.success("Document uploaded successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      let msg = error?.message || "Failed to upload document.";
      if (Array.isArray(error?.details) && error.details.length > 0) {
        const detailMsg = error.details.map((d: any) => d.message || d.field).join(", ");
        msg = `${msg}: ${detailMsg}`;
      }
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents.all });
    },
  });
}

export function useUpdateDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await updateDocumentAction(id, formData);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success("Document replaced successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      let msg = error?.message || "Failed to replace document.";
      if (Array.isArray(error?.details) && error.details.length > 0) {
        const detailMsg = error.details.map((d: any) => d.message || d.field).join(", ");
        msg = `${msg}: ${detailMsg}`;
      }
      toast.error(msg);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents.all });
    },
  });
}

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteDocumentAction(id);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success("Document deleted successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete document.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents.all });
    },
  });
}


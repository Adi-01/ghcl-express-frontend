"use client";

import { useState } from "react";
import { useUserDocumentsQuery } from "@/lib/hooks/queries/useUserDocumentsQuery";
import { useDeleteDocumentMutation } from "@/lib/hooks/mutations/useDocumentMutations";
import { DocumentItem } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { DocumentUpdateModal } from "./DocumentUpdateModal";
import {
  FileText,
  Plus,
  Loader2,
  BadgeCheck,
  BadgeAlert,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  RefreshCw,
  Trash2,
} from "lucide-react";

export function MyDocumentsClient() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const { data: documents, isLoading } = useUserDocumentsQuery(false);
  const deleteMutation = useDeleteDocumentMutation();

  const renderStatus = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
            <BadgeCheck className="w-4 h-4 text-emerald-400" />
            <span>Approved</span>
          </div>
        );
      case "REJECTED":
        return (
          <div className="flex items-center gap-1.5 text-rose-400 font-medium text-xs">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Rejected</span>
          </div>
        );
      case "PENDING":
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-400 font-medium text-xs">
            <BadgeAlert className="w-4 h-4 text-amber-400" />
            <span>Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My Documents
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Securely store and manage your official identity documents.
          </p>
        </div>
        <Button
          onClick={() => setShowUploadModal(true)}
          className="gap-2 shrink-0 bg-white text-black hover:bg-zinc-200"
        >
          <Plus className="w-4 h-4" />
          Add Document
        </Button>
      </div>

      {/* Documents Table / Card */}
      <div className="w-full bg-[#121316] border border-border/60 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground">Loading documents...</p>
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <FileText className="w-10 h-10 text-muted-foreground/60 mb-3" />
            <p className="text-sm font-medium text-white">No documents uploaded yet.</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Upload government ID proofs to complete your employee profile verification.
            </p>
            <Button
              onClick={() => setShowUploadModal(true)}
              size="sm"
              className="mt-4 gap-2 bg-white text-black hover:bg-zinc-200"
            >
              <Plus className="w-4 h-4" />
              Add Document
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader className="bg-black/20 border-b border-border/60">
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="w-16 text-xs text-muted-foreground font-semibold">Sr.</TableHead>
                  <TableHead className="w-[180px] text-xs text-muted-foreground font-semibold">Document Type</TableHead>
                  <TableHead className="w-[130px] text-xs text-muted-foreground font-semibold">Status</TableHead>
                  <TableHead className="w-[150px] text-xs text-muted-foreground font-semibold">Document Number</TableHead>
                  <TableHead className="w-[130px] text-xs text-muted-foreground font-semibold">Uploaded On</TableHead>
                  <TableHead className="w-[80px] text-right text-xs text-muted-foreground font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc, index) => {
                  const status = doc.verification_status || doc.status || "PENDING";
                  const fileUrl = doc.document_file_url || doc.document_url;
                  return (
                    <TableRow
                      key={doc.id}
                      className="border-b border-border/40 hover:bg-white/[0.02] transition-colors"
                    >
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {String(index + 1).padStart(2, "0")}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-white truncate" title={doc.document_type.replace(/_/g, " ")}>
                        {doc.document_type.replace(/_/g, " ")}
                      </TableCell>
                      <TableCell className="overflow-hidden">{renderStatus(status)}</TableCell>
                      <TableCell className="font-mono text-xs tracking-wider text-muted-foreground truncate" title={doc.document_number || "-"}>
                        {doc.document_number || "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate">
                        {new Date(doc.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-40 bg-[#121316] border border-border text-white shadow-lg"
                          >
                            {fileUrl && (
                              <DropdownMenuItem
                                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                                onClick={() => window.open(fileUrl, "_blank")}
                              >
                                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                                View / Open
                              </DropdownMenuItem>
                            )}
                            {status !== "APPROVED" && (
                              <DropdownMenuItem
                                className="cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                                onClick={() => setEditingDoc(doc)}
                              >
                                <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" />
                                Replace
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => setDeletingDocId(doc.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <DocumentUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
      />

      {/* Replace / Update Modal */}
      <DocumentUpdateModal
        open={Boolean(editingDoc)}
        onOpenChange={(open) => !open && setEditingDoc(null)}
        document={editingDoc}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingDocId)}
        onOpenChange={(open) => !open && setDeletingDocId(null)}
        title="Delete Document"
        description="Are you sure you want to remove this document?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deletingDocId) {
            deleteMutation.mutate(deletingDocId);
            setDeletingDocId(null);
          }
        }}
      />
    </div>
  );
}

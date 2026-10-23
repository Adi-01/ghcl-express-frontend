"use client";

import { useState, useRef } from "react";
import { useUploadDocumentMutation } from "@/lib/hooks/mutations/useDocumentMutations";
import { DocumentType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Upload, Loader2, AlertCircle, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "OTHER", label: "Other Official ID" },
];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB (1,048,576 bytes)
const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function DocumentUploadModal({
  open,
  onOpenChange,
}: DocumentUploadModalProps) {
  const [docType, setDocType] = useState<DocumentType>("AADHAAR");
  const [docNumber, setDocNumber] = useState("");
  const [docNumberTouched, setDocNumberTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocumentMutation();

  const isDocNumberRequired = docType === "AADHAAR" || docType === "PAN";

  // Instant Validation for document number
  const getDocNumberError = () => {
    const cleanNum = docNumber.trim().toUpperCase();

    if (docType === "AADHAAR") {
      if (!cleanNum) {
        return "Aadhaar number is required.";
      }
      if (!AADHAAR_REGEX.test(cleanNum)) {
        return "Aadhaar number must be exactly 12 numeric digits.";
      }
      return null;
    }

    if (docType === "PAN") {
      if (!cleanNum) {
        return "PAN card number is required.";
      }
      if (!PAN_REGEX.test(cleanNum)) {
        return "PAN format is invalid (must be 5 letters, 4 digits, 1 letter, e.g. ABCDE1234F).";
      }
      return null;
    }

    return null;
  };

  const docNumberError = getDocNumberError();
  const hasErrors = Boolean(docNumberError);

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMessage(null);

    // 1. Strict PDF type check
    const isPdf =
      selectedFile.type === "application/pdf" ||
      selectedFile.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
      toast.error("Only PDF documents are accepted for KYC verification.");
      setErrorMessage("Only PDF documents are accepted for KYC verification.");
      return false;
    }

    // 2. Strict 1 MB max size check - Deny instantly if > 1 MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
      const sizeMb = (selectedFile.size / (1024 * 1024)).toFixed(2);
      toast.error(`File size (${sizeMb} MB) exceeds the 1 MB limit. Upload denied.`);
      setErrorMessage(
        `File size (${sizeMb} MB) exceeds the maximum allowed limit of 1 MB. Upload denied.`
      );
      return false;
    }

    // 3. Reject empty files (0 bytes)
    if (selectedFile.size === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setFile(null);
      toast.error("Selected file is empty (0 bytes).");
      setErrorMessage("File is empty (0 bytes). Please select a valid document.");
      return false;
    }

    setFile(selectedFile);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uploadMutation.isPending) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploadMutation.isPending) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDocNumberTouched(true);
    if (!file || hasErrors || uploadMutation.isPending) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 1 MB limit. Upload denied.");
      setErrorMessage("File size exceeds the maximum allowed limit of 1 MB.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setErrorMessage(null);
    const formData = new FormData();
    formData.append("document_type", docType);
    if (docNumber.trim()) {
      formData.append("document_number", docNumber.trim().toUpperCase());
    }
    // Append both keys for maximum backend compatibility
    formData.append("document_file", file);
    formData.append("document", file);

    uploadMutation.mutate(formData, {
      onSuccess: () => {
        setFile(null);
        setDocNumber("");
        setDocNumberTouched(false);
        setErrorMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onOpenChange(false);
      },
      onError: (err: any) => {
        let msg = err?.message || "Failed to upload document.";
        if (Array.isArray(err?.details) && err.details.length > 0) {
          const detailStr = err.details.map((d: any) => d.message || d.field).join(", ");
          msg = `${msg}: ${detailStr}`;
        }
        setErrorMessage(msg);
      },
    });
  };

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    setErrorMessage(null);
    setFile(null);
    setDocNumberTouched(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#121316] border border-border text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="docType" className="text-xs text-muted-foreground">
              Document Type
            </Label>
            <Select
              value={docType}
              onValueChange={(val) => {
                setDocType(val as DocumentType);
                setDocNumberTouched(false);
                setErrorMessage(null);
              }}
              disabled={uploadMutation.isPending}
            >
              <SelectTrigger id="docType" className="bg-black/40 border-border">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-[#121316] border-border text-white">
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="docNum" className="text-xs text-muted-foreground flex items-center gap-1">
              <span>Document Number</span>
              {isDocNumberRequired ? (
                <span className="text-rose-400 font-semibold">* (Required)</span>
              ) : (
                <span className="text-zinc-500">(Optional)</span>
              )}
            </Label>
            <Input
              id="docNum"
              placeholder={
                docType === "AADHAAR"
                  ? "Enter 12-digit Aadhaar number"
                  : docType === "PAN"
                  ? "Enter 10-character PAN (e.g. ABCDE1234F)"
                  : "Enter identity number"
              }
              value={docNumber}
              onChange={(e) => {
                setDocNumber(e.target.value.toUpperCase());
                setDocNumberTouched(true);
                setErrorMessage(null);
              }}
              onBlur={() => setDocNumberTouched(true)}
              maxLength={docType === "AADHAAR" ? 12 : docType === "PAN" ? 10 : 50}
              disabled={uploadMutation.isPending}
              className="uppercase font-mono bg-black/40 border-border"
            />
            {docNumberTouched && docNumberError && (
              <p className="text-xs text-destructive animate-in fade-in">
                {docNumberError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              PDF Document (Max 1 MB)
            </Label>

            {/* Hidden native input for file selection */}
            <input
              ref={fileInputRef}
              id="fileInput"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
              className="hidden"
            />

            {!file ? (
              <Attachment
                state="idle"
                className={cn(
                  "w-full cursor-pointer flex-row items-center justify-center gap-3 p-5 border-dashed border-border bg-black/20 hover:border-zinc-500 hover:bg-white/[0.02] transition-all select-none rounded-lg",
                  isDragging && "border-white/60 bg-white/[0.04]",
                  uploadMutation.isPending && "pointer-events-none opacity-50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <AttachmentTrigger
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  aria-label="Upload PDF document"
                />
                <AttachmentMedia
                  variant="icon"
                  className="bg-white/5 text-zinc-400 size-9 rounded-lg"
                >
                  <Upload className="w-4 h-4" />
                </AttachmentMedia>
                <AttachmentContent className="text-left">
                  <AttachmentTitle className="text-xs font-medium text-zinc-200">
                    Click to select or drag & drop PDF
                  </AttachmentTitle>
                  <AttachmentDescription className="text-[11px] text-muted-foreground">
                    Strictly max 1 MB • PDF format only
                  </AttachmentDescription>
                </AttachmentContent>
              </Attachment>
            ) : (
              <Attachment
                state={uploadMutation.isPending ? "uploading" : "done"}
                className="w-full flex-row items-center justify-between p-3 bg-card border-border rounded-lg"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <AttachmentMedia
                    variant="icon"
                    className="bg-sky-500/10 text-sky-400 size-9 rounded-lg shrink-0"
                  >
                    {uploadMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-sky-400" />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent className="min-w-0 flex-1">
                    <AttachmentTitle
                      className="text-xs font-medium text-white truncate"
                      title={file.name}
                    >
                      {file.name}
                    </AttachmentTitle>
                    <AttachmentDescription className="text-[11px] text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • Ready to upload
                    </AttachmentDescription>
                  </AttachmentContent>
                </div>
                <AttachmentActions>
                  <AttachmentAction
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md"
                    onClick={handleRemoveFile}
                    disabled={uploadMutation.isPending}
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="sr-only">Remove file</span>
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || hasErrors || uploadMutation.isPending}
              className="gap-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

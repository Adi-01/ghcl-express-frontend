"use client";

import { useState, useEffect } from "react";
import { useUpdateDocumentMutation } from "@/lib/hooks/mutations/useDocumentMutations";
import { DocumentItem, DocumentType } from "@/lib/types";
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
import { Upload, Loader2, AlertCircle, FileCheck } from "lucide-react";

interface DocumentUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentItem | null;
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PAN", label: "PAN Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "OTHER", label: "Other Official ID" },
];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function DocumentUpdateModal({
  open,
  onOpenChange,
  document,
}: DocumentUpdateModalProps) {
  const [docType, setDocType] = useState<DocumentType>("AADHAAR");
  const [docNumber, setDocNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setDocType(document.document_type);
      setDocNumber(document.document_number || "");
      setFile(null);
      setErrorMessage(null);
    }
  }, [document]);

  const updateMutation = useUpdateDocumentMutation();

  const getDocNumberError = () => {
    if (!docNumber.trim()) return null;
    const cleanNum = docNumber.trim().toUpperCase();
    if (docType === "AADHAAR" && !AADHAAR_REGEX.test(cleanNum)) {
      return "Aadhaar number must be exactly 12 numeric digits.";
    }
    if (docType === "PAN" && !PAN_REGEX.test(cleanNum)) {
      return "PAN format is invalid (must be 5 letters, 4 digits, 1 letter, e.g. ABCDE1234F).";
    }
    return null;
  };

  const getFileError = () => {
    if (!file) return null;
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdf) {
      return "Only PDF documents are accepted for KYC verification.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum 1 MB limit.`;
    }
    return null;
  };

  const docNumberError = getDocNumberError();
  const fileError = getFileError();
  const hasErrors = Boolean(docNumberError || fileError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !file || hasErrors) return;

    setErrorMessage(null);
    const formData = new FormData();
    formData.append("document_type", docType);
    if (docNumber.trim()) {
      formData.append("document_number", docNumber.trim().toUpperCase());
    }
    formData.append("document_file", file);
    formData.append("document", file);

    updateMutation.mutate(
      { id: document.id, formData },
      {
        onSuccess: () => {
          setFile(null);
          setErrorMessage(null);
          onOpenChange(false);
        },
        onError: (err: any) => {
          let msg = err?.message || "Failed to replace document.";
          if (Array.isArray(err?.details) && err.details.length > 0) {
            const detailStr = err.details.map((d: any) => d.message || d.field).join(", ");
            msg = `${msg}: ${detailStr}`;
          }
          setErrorMessage(msg);
        },
      }
    );
  };

  const handleClose = () => {
    if (updateMutation.isPending) return;
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#121316] border border-border text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-white">
            Replace Document
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
                setErrorMessage(null);
              }}
              disabled={updateMutation.isPending}
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
            <Label htmlFor="docNum" className="text-xs text-muted-foreground">
              Document Number (Optional)
            </Label>
            <Input
              id="docNum"
              placeholder={
                docType === "AADHAAR"
                  ? "e.g. 123456789012"
                  : docType === "PAN"
                  ? "e.g. ABCDE1234F"
                  : "Enter identity number"
              }
              value={docNumber}
              onChange={(e) => {
                setDocNumber(e.target.value.toUpperCase());
                setErrorMessage(null);
              }}
              disabled={updateMutation.isPending}
              className="uppercase font-mono bg-black/40 border-border"
            />
            {docNumberError && (
              <p className="text-xs text-destructive animate-in fade-in">
                {docNumberError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fileInput" className="text-xs text-muted-foreground">
              New PDF Document (Max 1 MB)
            </Label>
            <Input
              id="fileInput"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                setErrorMessage(null);
                setFile(e.target.files?.[0] || null);
              }}
              required
              disabled={updateMutation.isPending}
              className="bg-black/40 border-border text-xs cursor-pointer file:text-white file:border-0 file:bg-zinc-800 file:rounded file:px-2 file:py-1 file:mr-2"
            />
            {file && !fileError && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5 pt-0.5">
                <FileCheck className="w-3.5 h-3.5" />
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
            {fileError && (
              <p className="text-xs text-destructive animate-in fade-in">
                {fileError}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateMutation.isPending}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || hasErrors || updateMutation.isPending}
              className="gap-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Replacing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Replace
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

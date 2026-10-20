"use client";

import { useState } from "react";
import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";
import { useDeleteBankDetailsMutation } from "@/lib/hooks/mutations/useProfileMutations";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EditProfileModal } from "./EditProfileModal";
import { BankDetailsModal } from "./BankDetailsModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Phone,
  Mail,
  Edit2,
  Trash2,
  PlusCircle,
  Building2,
  Landmark,
  CreditCard,
  Hash,
  Briefcase,
  UserCircle,
  Loader2,
} from "lucide-react";

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-border/40 last:border-0">
      <div className="mt-1 text-muted-foreground/70">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium text-white mt-1">
          {value || (
            <span className="italic text-muted-foreground/50 text-xs">
              Not provided
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export function ProfileClient() {
  const [reveal, setReveal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: user, isLoading } = useProfileQuery(reveal);
  const deleteBankMutation = useDeleteBankDetailsMutation();

  if (isLoading && !user) {
    return (
      <div className="min-h-[50vh] flex flex-col justify-center items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const bankDetails = user?.bank_details;
  const phoneNumber = user?.phone_number || user?.phoneNumber;
  const username = user?.username;
  const empId = user?.emp_id;
  const designation = user?.designation || "Employee";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-500">
      {/* Centered Profile Hero */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-white/10 shadow-lg">
          <AvatarFallback className="text-3xl sm:text-4xl bg-zinc-800 text-white font-semibold">
            {getInitials(username || user?.email)}
          </AvatarFallback>
        </Avatar>

        <h1 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {username || "Unnamed User"}
        </h1>

        <p className="text-muted-foreground text-sm mt-1">{designation}</p>

        {empId && (
          <p className="text-xs font-mono text-muted-foreground/70 mt-1">
            {empId}
          </p>
        )}

        <div className="mt-5 flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-full px-5 text-xs font-medium border-border/80 hover:bg-zinc-800 text-white"
            onClick={() => setShowEditProfile(true)}
          >
            <Edit2 className="w-3.5 h-3.5 mr-2" />
            Edit Profile
          </Button>

          {/* Reveal sensitive numbers switch: ONLY shown when bank details exist */}
          {Boolean(bankDetails) && (
            <div className="flex items-center gap-2 bg-[#121316] border border-border/60 px-3 py-1.5 rounded-full">
              <Switch
                id="reveal-switch"
                checked={reveal}
                onCheckedChange={setReveal}
                className="scale-75"
              />
              <Label
                htmlFor="reveal-switch"
                className="text-[11px] text-muted-foreground cursor-pointer select-none"
              >
                Reveal
              </Label>
            </div>
          )}
        </div>
      </div>

      {/* Profile Details Sections */}
      <div className="w-full mt-12 sm:mt-16 space-y-10 sm:space-y-12">
        {/* Personal Information */}
        <section className="bg-[#121316] border border-border/60 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Personal Information
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your personal account details.
            </p>
          </div>

          <ProfileRow icon={UserCircle} label="Username" value={username} />
          <ProfileRow icon={Mail} label="Email Address" value={user?.email} />
          <ProfileRow icon={Phone} label="Phone Number" value={phoneNumber} />
        </section>

        {/* Work Information */}
        <section className="bg-[#121316] border border-border/60 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Work Information
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Information maintained by your organization.
            </p>
          </div>

          <ProfileRow icon={Hash} label="Employee ID" value={empId} />
          <ProfileRow
            icon={Briefcase}
            label="Designation"
            value={designation}
          />
        </section>

        {/* Bank Information */}
        <section className="bg-[#121316] border border-border/60 rounded-xl p-5 sm:p-6 shadow-sm">
          <div className="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Bank Details
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your salary account information.
              </p>
            </div>

            {bankDetails ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-border/80 text-white hover:bg-zinc-800"
                  onClick={() => setShowBankModal(true)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-rose-400 hover:bg-rose-950/30"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs border-border/80 text-white hover:bg-zinc-800"
                onClick={() => setShowBankModal(true)}
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                Add Bank
              </Button>
            )}
          </div>

          {bankDetails ? (
            <div>
              <ProfileRow
                icon={Building2}
                label="Bank Name"
                value={bankDetails.bank_name}
              />
              {bankDetails.branch_name && (
                <ProfileRow
                  icon={Building2}
                  label="Branch"
                  value={bankDetails.branch_name}
                />
              )}
              <ProfileRow
                icon={UserCircle}
                label="Account Holder"
                value={bankDetails.account_holder_name}
              />
              <ProfileRow
                icon={CreditCard}
                label="Account Number"
                value={bankDetails.account_number}
              />
              <ProfileRow
                icon={Hash}
                label="IFSC Code"
                value={bankDetails.ifsc_code}
              />
              <ProfileRow
                icon={Landmark}
                label="Account Type"
                value={bankDetails.account_type || "SAVINGS"}
              />
            </div>
          ) : (
            <div className="border border-dashed border-border/60 rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground bg-black/20">
              <Landmark className="w-8 h-8 mb-2 opacity-40 text-white" />
              <p className="text-sm font-medium text-white/80">No bank details provided.</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add your bank account for salary disbursal.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        user={user}
      />

      {/* Bank Details Modal */}
      <BankDetailsModal
        open={showBankModal}
        onOpenChange={setShowBankModal}
        bankDetails={bankDetails}
      />

      {/* Confirm Bank Deletion */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Bank Account"
        description="Are you sure you want to remove your bank account details?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          deleteBankMutation.mutate();
          setShowDeleteConfirm(false);
        }}
      />
    </div>
  );
}

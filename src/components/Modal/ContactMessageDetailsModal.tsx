import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminUpdateContactMessage,
  type AdminContactUpdatePayload,
} from "@/features/contact/adminContactApi";
import type { ContactMessageDto, ContactMessageStatus } from "@/features/contact/types";
import { showError, showSuccess } from "@/lib/sweetAlert";

const STATUS_OPTIONS: { value: ContactMessageStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
];

type ContactMessageDetailsModalProps = {
  open: boolean;
  message: ContactMessageDto | null;
  loading?: boolean;
  onClose: () => void;
  onUpdated: (message: ContactMessageDto) => void;
};

export function ContactMessageDetailsModal({
  open,
  message,
  loading = false,
  onClose,
  onUpdated,
}: ContactMessageDetailsModalProps) {
  const [status, setStatus] = useState<ContactMessageStatus>("new");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!message) return;
    setStatus(message.status === "replied" ? "read" : message.status);
    setAdminNotes(message.admin_notes ?? "");
  }, [message]);

  if (!open) return null;

  async function handleSave() {
    if (!message) return;
    setSaving(true);
    try {
      const payload: AdminContactUpdatePayload = {
        status,
        admin_notes: adminNotes.trim() || null,
      };
      const updated = await adminUpdateContactMessage(message.id, payload);
      onUpdated(updated);
      showSuccess("Contact message updated.");
      onClose();
    } catch {
      showError("Could not update contact message.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-message-modal-title"
      >
        <div className="border-b border-border-light px-6 py-4">
          <h3
            id="contact-message-modal-title"
            className="text-lg font-semibold text-ink-heading"
          >
            Contact message
          </h3>
          {message ? (
            <p className="mt-1 text-sm text-body-secondary">{message.created_at}</p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading || !message ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-8 animate-spin text-brand" aria-hidden />
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-ink-heading">From</p>
                <p className="text-body-secondary">
                  {message.full_name}{" "}
                  <a
                    href={`mailto:${message.email}`}
                    className="text-brand hover:underline"
                  >
                    {message.email}
                  </a>
                </p>
              </div>
              <div>
                <p className="font-medium text-ink-heading">Subject</p>
                <p className="text-body-secondary">{message.subject}</p>
              </div>
              <div>
                <p className="font-medium text-ink-heading">Message</p>
                <p className="whitespace-pre-wrap text-body-secondary">{message.message}</p>
              </div>
              <div>
                <label
                  htmlFor="contact-msg-status"
                  className="mb-1 block font-medium text-ink-heading"
                >
                  Status
                </label>
                <select
                  id="contact-msg-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContactMessageStatus)}
                  className="h-9 w-full rounded-lg border border-border-gray bg-muted px-3 text-sm text-ink"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="contact-msg-notes"
                  className="mb-1 block font-medium text-ink-heading"
                >
                  Admin notes
                </label>
                <textarea
                  id="contact-msg-notes"
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this enquiry…"
                  className="w-full resize-none rounded-lg border border-border-gray bg-muted px-3 py-2 text-sm text-ink placeholder:text-placeholder-text"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-border-light px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-border-gray text-sm font-medium text-ink-heading hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!message || saving}
            onClick={() => void handleSave()}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-medium text-ice hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

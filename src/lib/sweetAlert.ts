import Swal, { type SweetAlertIcon, type SweetAlertOptions, type SweetAlertResult } from "sweetalert2";

export { Swal };
export type { SweetAlertOptions, SweetAlertResult };

const BUTTONS = {
  confirmButtonColor: "#0B1C30",
  cancelButtonColor: "#64748b",
} as const;

const DISMISS = {
  showCloseButton: true,
  closeButtonAriaLabel: "Close",
  allowEscapeKey: true,
  allowOutsideClick: true,
} as const;

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  showCloseButton: true,
  closeButtonAriaLabel: "Close",
  timer: 4000,
  timerProgressBar: true,
  didOpen: (popup) => {
    popup.onmouseenter = Swal.stopTimer;
    popup.onmouseleave = Swal.resumeTimer;
  },
});

const modal = Swal.mixin({
  ...DISMISS,
  ...BUTTONS,
});

function showToast(icon: SweetAlertIcon, message: string) {
  return toast.fire({ icon, title: message });
}

export type ConfirmOptions = {
  title?: string;
  text?: string;
  html?: string;
  icon?: SweetAlertIcon;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
};

/** Global alerts — import from `@/lib/sweetAlert` anywhere in the app. */
export const alert = {
  success(message: string, title = "Success") {
    return modal.fire({
      icon: "success",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  },

  error(message: string, title = "Error") {
    return modal.fire({
      icon: "error",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  },

  warning(message: string, title = "Warning") {
    return modal.fire({
      icon: "warning",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  },

  info(message: string, title = "Info") {
    return modal.fire({
      icon: "info",
      title,
      text: message,
      confirmButtonText: "OK",
    });
  },

  toast: {
    success: (message: string) => showToast("success", message),
    error: (message: string) => showToast("error", message),
    warning: (message: string) => showToast("warning", message),
    info: (message: string) => showToast("info", message),
  },

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const result = await modal.fire({
      icon: options.icon ?? "question",
      title: options.title ?? "Are you sure?",
      text: options.text,
      html: options.html,
      showCancelButton: true,
      confirmButtonText: options.confirmText ?? "Yes",
      cancelButtonText: options.cancelText ?? "Cancel",
      confirmButtonColor: options.confirmButtonColor ?? BUTTONS.confirmButtonColor,
      cancelButtonColor: BUTTONS.cancelButtonColor,
    });
    return result.isConfirmed;
  },

  async confirmDelete(itemLabel: string, extraText?: string): Promise<boolean> {
    const detail = extraText ? `<p class="mt-2 text-sm">${extraText}</p>` : "";
    return alert.confirm({
      title: "Delete?",
      html: `<p>Delete <strong>${escapeHtml(itemLabel)}</strong>? This cannot be undone.</p>${detail}`,
      icon: "warning",
      confirmText: "Yes, delete",
      confirmButtonColor: "#dc2626",
    });
  },

  crud: {
    created: (entity = "Record") => alert.toast.success(`${entity} created successfully.`),
    updated: (entity = "Record") => alert.toast.success(`${entity} updated successfully.`),
    deleted: (entity = "Record") => alert.toast.success(`${entity} deleted successfully.`),
    saved: (entity = "Changes") => alert.toast.success(`${entity} saved successfully.`),
    processed: (message: string) => alert.toast.success(message),
  },
};

/** Drop-in replacements for react-hot-toast. */
export const showSuccess = (message: string) => alert.toast.success(message);
export const showError = (message: string) => alert.toast.error(message);
export const showWarning = (message: string) => alert.toast.warning(message);
export const showInfo = (message: string) => alert.toast.info(message);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default alert;

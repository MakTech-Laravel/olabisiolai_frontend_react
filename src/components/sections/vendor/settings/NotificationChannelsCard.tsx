import { Mail, MessageCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function RedToggle({
  checked,
  onCheckedChange,
  id,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-red" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-6 rounded-full bg-white shadow-md ring-0 transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

export function NotificationChannelsCard({
  notifyEmail,
  setNotifyEmail,
  notifySms,
  setNotifySms,
  notifyWhatsapp,
  setNotifyWhatsapp,
  disabled = false,
}: {
  notifyEmail: boolean;
  setNotifyEmail: (v: boolean) => void;
  notifySms: boolean;
  setNotifySms: (v: boolean) => void;
  notifyWhatsapp: boolean;
  setNotifyWhatsapp: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-xl border-sky-100/80 bg-[#D3E4FE] shadow-sm">
      <CardHeader className="px-6 py-5">
        <CardTitle className="text-lg font-bold text-foreground font-manrope">
          Notification channels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 px-6 pb-6">
        <div className="flex items-center justify-between gap-3 pb-3 first:pt-0">
          <div className="flex items-center gap-3">
            <Mail className="size-4" aria-hidden />
            <span className="text-sm font-medium text-foreground font-inter">Email alerts</span>
          </div>
          <RedToggle checked={notifyEmail} onCheckedChange={setNotifyEmail} disabled={disabled} />
        </div>
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="size-4" aria-hidden />
            <span className="text-sm font-medium text-foreground font-inter">SMS notifications</span>
          </div>
          <RedToggle checked={notifySms} onCheckedChange={setNotifySms} disabled={disabled} />
        </div>
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-3">
            <MessageCircle className="size-4" aria-hidden />
            <span className="text-sm font-medium text-foreground font-inter">WhatsApp updates</span>
          </div>
          <RedToggle checked={notifyWhatsapp} onCheckedChange={setNotifyWhatsapp} disabled={disabled} />
        </div>
        <p className="mt-4 text-xs italic text-muted-foreground font-inter leading-relaxed">
          Premium members may receive priority routing for urgent booking alerts.
        </p>
      </CardContent>
    </Card>
  );
}
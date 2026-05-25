import { Mail } from "lucide-react";

export function FooterContact() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center py-2 border-t">
      <p className="text-sm text-muted-foreground">
        Need help choosing the right tier?
      </p>
      <div className="flex items-center justify-center gap-4">
        <a 
          href="mailto:vendor-support@example.com" 
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Contact our Vendor Success Team</span>
          <span className="sm:hidden">Contact Support</span>
        </a>
      </div>
    </div>
  );
}

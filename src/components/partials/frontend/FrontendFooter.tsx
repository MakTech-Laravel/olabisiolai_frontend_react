import { Link } from "react-router-dom";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

const LOGO_FOOTER = "/images/landing/gidira-logo-footer.svg";

const footerColumns = [
  {
    title: "Company",
    links: [
      { label: "About Gidira", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "Careers", to: "/careers" },
    ] as const,
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy-policy" },
      { label: "Cookies Policy", to: "/cookies-policy" },
    ] as const,
  },
  {
    title: "Resources",
    links: [{ label: "Business Tips", to: "/business-tips" }, { label: "FAQs", to: "/faq" }] as const,
  },
] as const;

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; to?: string }[];
}) {
  return (
    <div>
      <h4 className="font-heading text-base font-semibold text-white">{title}</h4>
      <ul className="mt-4 flex list-none flex-col gap-2 p-0">
        {links.map(({ label, to }) => (
          <li key={label}>
            {to ? (
              <Link
                to={to}
                className="text-sm text-footer-muted transition-colors hover:text-white"
              >
                {label}
              </Link>
            ) : (
              <a
                href="#"
                className="text-sm text-footer-muted transition-colors hover:text-white"
              >
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FrontendFooter() {
  return (
    <footer className="bg-footer-bar px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className={cn(container)}>
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-8">
          <div className="max-w-xs lg:max-w-sm">
            <Link to="/" className="inline-block">
              <img
                src={LOGO_FOOTER}
                alt="Gidira"
                width={103}
                height={32}
                decoding="async"
                className="block h-8 w-auto max-w-full object-contain object-left sm:h-9"
              />
            </Link>
            <p className="mt-4 text-sm leading-5 text-ice">
              FIND BETTER | CONNECT FASTER
            </p>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-10 sm:grid-cols-3">
            {footerColumns.map((col) => (
              <FooterCol key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-8 text-center">
          <p className="text-sm text-footer-muted">
            © {new Date().getFullYear()} GIDIRA. All rights reserved. Built for
            Nigeria&apos;s Digital Economy.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { type FormEvent, type ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, MessageCircle, Phone } from "lucide-react";

import {
  getContactSubmitErrorMessage,
  submitContactMessage,
} from "@/api/contactMessages";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { container } from "@/lib/container";
import { alert, showError } from "@/lib/sweetAlert";
import { cn } from "@/lib/utils";

const WHATSAPP_DISPLAY = "+2349047858961";
const WHATSAPP_HREF = "https://wa.me/2349047858961";

const BUSINESS_TIP_LINKS = [
  { label: "Photos That Sell", to: "/business-tips/photos-that-sell" },
  {
    label: "Writing a Compelling Description",
    to: "/business-tips/writing-a-compelling-description",
  },
  {
    label: "Responding to Customer Enquiries",
    to: "/business-tips/responding-to-customer-enquiries",
  },
  {
    label: "Pricing Your Services Right",
    to: "/business-tips/pricing-your-services-right",
  },
  {
    label: "Getting More Positive Reviews",
    to: "/business-tips/getting-more-positive-reviews",
  },
  {
    label: "Marketing Beyond Gidira",
    to: "/business-tips/marketing-beyond-gidira",
  },
] as const;

function ContactChannelCard({
  iconWrapClassName,
  icon,
  title,
  description,
  href,
  linkLabel,
}: {
  iconWrapClassName: string;
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 rounded-2xl border border-black/10 bg-card p-6 text-center shadow-sm",
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            iconWrapClassName,
          )}
          aria-hidden
        >
          {icon}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-medium text-ink-heading">{title}</h3>
          <p className="text-base text-ink-muted">{description}</p>
        </div>
      </div>
      <a
        href={href}
        className="text-base text-footer-bar transition-opacity hover:opacity-80"
        {...(href.startsWith("http") || href.startsWith("mailto:")
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {linkLabel}
      </a>
    </div>
  );
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setSubmitting(true);
    try {
      await submitContactMessage({
        full_name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        subject: String(data.get("subject") ?? "").trim(),
        message: String(data.get("message") ?? "").trim(),
      });
      form.reset();
      setSubmitted(true);
      await alert.success(
        "We've received your message and will get back to you within 24 hours.",
        "Message sent",
      );
    } catch (error) {
      showError(
        getContactSubmitErrorMessage(
          error,
          "Could not send your message. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full bg-muted">
      <div
        className={cn(
          container,
          "flex  flex-col gap-12 py-16 sm:py-20",
        )}
      >
        <header className="flex w-full  flex-col gap-4 px-1">
          <h1 className="lg:text-4xl text-2xl font-bold leading-10 text-ink-heading">
            Contact Us
          </h1>
          <p className="max-w-4xl text-xl font-normal leading-7 text-body-secondary">
            Have questions? We&apos;d love to hear from you. Send us a message
            and we&apos;ll respond as soon as possible.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <ContactChannelCard
            iconWrapClassName="bg-accent"
            icon={<Mail className="size-6 text-brand" strokeWidth={2} />}
            title="Email"
            description="Send us an email anytime"
            href="mailto:hello@gidira.com"
            linkLabel="hello@gidira.com"
          />
          <ContactChannelCard
            iconWrapClassName="bg-success/15"
            icon={<MessageCircle className="size-6 text-success" strokeWidth={2} />}
            title="WhatsApp"
            description="Chat with us directly"
            href={WHATSAPP_HREF}
            linkLabel={WHATSAPP_DISPLAY}
          />
          <ContactChannelCard
            iconWrapClassName="bg-tint-red"
            icon={<Phone className="size-6 text-brand-red" strokeWidth={2} />}
            title="Phone"
            description="Mon-Fri 9am-5pm WAT"
            href="tel:+2349047858961"
            linkLabel={WHATSAPP_DISPLAY}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col gap-1">
              <h2 className="text-base font-medium text-ink-heading">
                Send us a Message
              </h2>
              <p className="text-base text-ink-muted">
                Fill out the form below and we&apos;ll get back to you within 24
                hours.
              </p>
            </div>
            {submitted ? (
              <p className="text-sm text-body-secondary" role="status">
                Thanks — your message has been noted. We&apos;ll reply soon.
              </p>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-name"
                    className="text-sm font-medium text-ink-heading"
                  >
                    Full Name
                  </label>
                  <Input
                    id="contact-name"
                    name="name"
                    required
                    placeholder="Your Name"
                    className="h-9 rounded-[10px] border-transparent bg-muted text-sm placeholder:text-ink-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-email"
                    className="text-sm font-medium text-ink-heading"
                  >
                    Email
                  </label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="h-9 rounded-[10px] border-transparent bg-muted text-sm placeholder:text-ink-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-subject"
                    className="text-sm font-medium text-ink-heading"
                  >
                    Subject
                  </label>
                  <Input
                    id="contact-subject"
                    name="subject"
                    required
                    placeholder="How can we help?"
                    className="h-9 rounded-[10px] border-transparent bg-muted text-sm placeholder:text-ink-muted"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="contact-message"
                    className="text-sm font-medium text-ink-heading"
                  >
                    Message
                  </label>
                  <Textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Tell us more about your inquiry..."
                    className="min-h-16 rounded-[10px] border-transparent bg-muted text-sm placeholder:text-ink-muted"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand py-4 text-sm font-medium text-ice transition-opacity hover:opacity-90 disabled:opacity-70"
                >
                  {submitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {submitting ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {/* <div className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <MapPin
                  className="size-6 shrink-0 text-brand-red"
                  strokeWidth={2}
                  aria-hidden
                />
                <h3 className="text-base font-medium text-ink-heading">
                  Our Office
                </h3>
              </div>
              <div className="flex flex-col gap-2 pl-0 sm:pl-0">
                <p className="text-base leading-6 text-body-secondary">
                  123 Business District,
                  <br />
                  Victoria Island,
                  <br />
                  Lagos, Nigeria
                </p>
                <p className="text-sm leading-5 text-ink-muted">
                  Office hours: Monday - Friday, 9:00 AM - 5:00 PM WAT
                </p>
              </div>
            </div> */}

            <div className="rounded-2xl border border-black/10 bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-3">
                <div>
                  <h4 className="mb-1 text-base font-medium text-ink-heading">
                    For Businesses
                  </h4>
                  <ul className="flex flex-col gap-1 text-sm leading-5 text-body-secondary">
                    {BUSINESS_TIP_LINKS.map(({ label, to }) => (
                      <li key={to}>
                        <Link
                          className="text-footer-bar hover:underline"
                          to={to}
                        >
                          • {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-linear-to-r from-surface-soft to-tint-red p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-2">
                <h3 className="text-lg font-semibold leading-7 text-ink-heading">
                  24/7 WhatsApp Support
                </h3>
                <p className="text-sm leading-5 text-body-secondary">
                  Need immediate assistance? Our WhatsApp support is available
                  round the clock.
                </p>
              </div>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-brand-red py-4 text-sm font-normal text-ice transition-opacity hover:opacity-90"
              >
                <MessageCircle className="size-4 shrink-0" aria-hidden />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    Briefcase,
    Camera,
    Check,
    Image as ImageIcon,
    Link2,
    Megaphone,
    MessageCircle,
    Star,
    Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

/** Raster exports from Figma node 594:7536 — olabisiolai--Copy- */
const IMG_WHATSAPP = "/images/business-tips/marketing-beyond-whatsapp.jpg";
const IMG_INSTAGRAM_1 = "/images/business-tips/marketing-beyond-instagram-1.jpg";
const IMG_INSTAGRAM_2 = "/images/business-tips/marketing-beyond-instagram-2.jpg";
const IMG_QR_LINKING = "/images/business-tips/marketing-beyond-qr-linking.jpg";

function SafeImage({
    src,
    alt,
    className,
    fallbackLabel,
}: {
    src: string;
    alt: string;
    className?: string;
    fallbackLabel: string;
}) {
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-lg bg-neutral-200",
                    className,
                )}
            >
                <ImageIcon className="h-6 w-6 text-neutral-500" aria-hidden />
                <span className="text-xs text-neutral-500">{fallbackLabel}</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={cn("block h-full w-full object-cover", className)}
            onError={() => setFailed(true)}
            decoding="async"
        />
    );
}

const WHATSAPP_ITEMS = [
    {
        title: "Catalogs:",
        body: "List your top 10 products with high-quality images.",
    },
    {
        title: "Auto-Reply:",
        body: 'Set "Away" and "Greeting" messages for instant response.',
    },
    {
        title: "Labels:",
        body: 'Categorize chats by "New Customer" or "Pending Payment".',
    },
] as const;

const CALENDAR_DAYS: {
    day: string;
    theme: string;
    themeLines?: [string, string];
    borderMuted?: boolean;
    pbClass?: string;
}[] = [
        { day: "Monday", theme: "Behind Scenes", themeLines: ["Behind", "Scenes"] },
        { day: "Tuesday", theme: "Tip Tuesday", borderMuted: true, pbClass: "pb-12" },
        { day: "Wednesday", theme: "Client Success", themeLines: ["Client", "Success"] },
        { day: "Thursday", theme: "Product Showcase", themeLines: ["Product", "Showcase"], borderMuted: true },
        { day: "Friday", theme: "Weekend Special", themeLines: ["Weekend", "Special"] },
        { day: "Saturday", theme: "Engagement Polls", themeLines: ["Engagement", "Polls"], borderMuted: true },
        { day: "Sunday", theme: "Rest & Reflect", borderMuted: false, pbClass: "pb-12" },
    ];

export default function MarketingBeyondGidira() {
    return (
        <div className="w-full bg-white">
            {/* Hero — Figma 594:7569 */}
            <section className="relative overflow-hidden bg-gray-900 py-14 text-center sm:py-20 lg:py-28">
                <div
                    className="pointer-events-none absolute inset-0 opacity-20"
                    aria-hidden
                    style={{
                        backgroundImage:
                            "radial-gradient(ellipse 120% 80% at 100% 100%, rgb(0 109 54) 0%, transparent 55%)",
                    }}
                /> 
                <div className={cn(container, "relative z-10 flex flex-col items-center")}>
                    <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500">
                        <Megaphone className="h-9 w-9 text-gray-900" aria-hidden strokeWidth={2} />
                    </div>
                    <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-6xl lg:leading-[1.1]">
                        Marketing Beyond Gidira
                    </h1>
                    <p className="mt-6 max-w-3xl text-base font-medium leading-relaxed text-gray-300 sm:text-lg lg:text-2xl lg:leading-snug">
                        A comprehensive strategy guide for Nigerian businesses.
                        <br className="hidden sm:block" />
                        Discover how to leverage the full digital landscape to drive traffic back to your core
                        business hub.
                    </p>
                </div>
            </section>

            {/* Breadcrumb */}
            <section className="border-b border-neutral-100 bg-white py-4">
                <div className={cn(container)}>
                    <Link
                        to="/business-tips"
                        className="inline-flex items-center gap-2 text-base font-medium text-gray-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                        Back to Business Tips
                    </Link>
                </div>
            </section>

            <section className="pb-12 pt-10 lg:pb-20 lg:pt-12">
                <div className={cn(container, "flex flex-col gap-12 lg:gap-16")}>
                    {/* Bento — Figma 594:8089 */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                        {/* Your Marketing Ecosystem */}
                        <div className="flex flex-col justify-between gap-8 rounded-3xl bg-gray-100 p-8 sm:p-10 lg:col-span-8 lg:min-h-[320px] lg:p-12">
                            <div className="flex flex-col gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#76f99e]">
                                    <Star className="size-6 text-[#191c1e]" aria-hidden strokeWidth={2} />
                                </div>
                                <h2 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
                                    Your Marketing Ecosystem
                                </h2>
                                <p className="max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
                                    Gidira isn&apos;t just a listing; it&apos;s the anchor of your digital presence. Think of
                                    Gidira as your flagship store, while Instagram, WhatsApp, and Facebook are the
                                    roads leading customers to your door.
                                </p>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="flex flex-col gap-1 rounded-lg bg-white p-4 shadow-sm">
                                    <span className="text-base font-semibold text-green-700">Awareness</span>
                                    <p className="text-sm leading-snug text-gray-900">
                                        IG &amp; Facebook ads to find new customers.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1 rounded-lg bg-white p-4 shadow-sm">
                                    <span className="text-base font-semibold text-green-700">Conversion</span>
                                    <p className="text-sm leading-snug text-[#191c1e]">
                                        WhatsApp for direct sales and service.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1 rounded-lg bg-white p-4 shadow-sm">
                                    <span className="text-base font-semibold text-green-700">Trust</span>
                                    <p className="text-sm leading-snug text-[#191c1e]">
                                        Gidira profile for verified reviews and info.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Business Mastery */}
                        <div className="flex flex-col rounded-3xl border border-[rgba(197,198,205,0.15)] bg-white p-8 shadow-sm sm:p-9 lg:col-span-4">
                            <div className="mb-6 flex size-12 shrink-0 items-center justify-center rounded-full bg-green-100">
                                <MessageCircle className="size-5 text-green-700" aria-hidden strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold leading-tight text-gray-700 sm:text-2xl">
                                WhatsApp Business
                                <br />
                                Mastery
                            </h3>
                            <ul className="mt-4 flex flex-col gap-4">
                                {WHATSAPP_ITEMS.map(({ title, body }) => (
                                    <li key={title} className="flex gap-3">
                                        <Check
                                            className="mt-0.5 size-4 shrink-0 text-green-700"
                                            aria-hidden
                                            strokeWidth={3}
                                        />
                                        <p className="text-sm leading-snug text-gray-500">
                                            <span className="font-semibold">{title}</span>{" "}
                                            <span className="font-normal text-gray-500">{body}</span>
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 h-32 overflow-hidden rounded-lg bg-neutral-900 sm:h-36">
                                <SafeImage
                                    src={IMG_WHATSAPP}
                                    alt="WhatsApp Business catalog on multiple phones"
                                    className="rounded-lg"
                                    fallbackLabel="WhatsApp preview"
                                />
                            </div>
                        </div>

                        {/* Instagram */}
                        <div className="flex flex-col gap-6 rounded-3xl bg-gray-100 p-8 sm:flex-row sm:items-stretch sm:gap-8 sm:p-8 lg:col-span-6">
                            <div className="flex min-w-0 flex-1 flex-col gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                    <Camera className="size-5 text-pink-600" aria-hidden strokeWidth={2} />
                                </div>
                                <h3 className="text-xl font-bold leading-tight text-[#191c1e] sm:text-2xl">
                                    Instagram for
                                    <br />
                                    Nigerians
                                </h3>
                                <p className="text-sm leading-relaxed text-gray-500">
                                    Visual storytelling is king. Your feed should be a curated gallery of excellence.
                                </p>
                                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                                    <span className="text-xs font-semibold uppercase tracking-tight text-green-700">
                                        Before/After Clips
                                    </span>
                                    <span className="h-px w-8 bg-[rgba(0,109,54,0.3)]" aria-hidden />
                                    <span className="text-xs font-semibold uppercase tracking-tight text-green-700">
                                        Showcases
                                    </span>
                                </div>
                            </div>
                            <div className="grid min-h-[160px] flex-1 grid-cols-2 gap-2 sm:max-w-[280px] sm:self-center">
                                <div className="overflow-hidden rounded-lg">
                                    <SafeImage
                                        src={IMG_INSTAGRAM_1}
                                        alt="Instagram content example"
                                        className="min-h-[140px] object-cover sm:min-h-[160px]"
                                        fallbackLabel="Instagram"
                                    />
                                </div>
                                <div className="overflow-hidden rounded-lg">
                                    <SafeImage
                                        src={IMG_INSTAGRAM_2}
                                        alt="Instagram product showcase"
                                        className="min-h-[140px] object-cover sm:min-h-[160px]"
                                        fallbackLabel="Instagram"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Facebook Marketplace */}
                        <div className="relative overflow-hidden rounded-3xl border border-[rgba(197,198,205,0.15)] bg-white p-8 shadow-sm sm:p-9 lg:col-span-6">
                            <Store
                                className="pointer-events-none absolute -bottom-2 -right-2 size-32 text-blue-100/90 sm:size-36"
                                aria-hidden
                                strokeWidth={1}
                            />
                            <div className="relative flex flex-col gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                                    <Briefcase className="size-5 text-blue-600" aria-hidden strokeWidth={2} />
                                </div>
                                <h3 className="text-xl font-bold text-[#191c1e] sm:text-2xl">Facebook Marketplace</h3>
                                <p className="max-w-xl text-base leading-relaxed text-[#44474d]">
                                    Local commerce happens in groups. Reach thousands of potential buyers in your
                                    specific neighborhood.
                                </p>
                                <div className="flex flex-wrap gap-3 pt-1">
                                    {["Join Community Groups", "Daily Listing Refresh", "Local Targeting Ads"].map(
                                        (label) => (
                                            <span
                                                key={label}
                                                className="rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700"
                                            >
                                                {label}
                                            </span>
                                        ),
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Word-of-Mouth */}
                        <div className="flex flex-col justify-center gap-4 rounded-3xl bg-black px-8 py-10 sm:px-10 lg:col-span-5">
                            <h3 className="text-xl font-bold text-white sm:text-2xl">Word-of-Mouth</h3>
                            <p className="text-sm leading-relaxed text-gray-300">
                                The most powerful marketing in Nigeria is a recommendation from a friend.
                            </p>
                            <div className="mt-2 rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                <p className="text-xs font-normal italic text-white/90">Quick Strategy:</p>
                                <p className="mt-2 text-sm font-medium leading-relaxed text-white">
                                    Create &quot;Refer-a-Friend&quot; discounts and distribute physical business cards with QR
                                    codes.
                                </p>
                            </div>
                        </div>

                        {/* Linking Everything to Gidira */}
                        <div className="flex flex-col gap-8 rounded-3xl bg-gray-100 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10 lg:col-span-7">
                            <div className="flex max-w-sm flex-col gap-4">
                                <h3 className="text-xl font-bold leading-tight text-[#191c1e] sm:text-2xl">
                                    Linking Everything to
                                    <br />
                                    Gidira
                                </h3>
                                <p className="text-sm leading-relaxed text-[#44474d]">
                                    Ensure every social touchpoint leads back to your verified profile. This builds
                                    instant credibility and captures leads.
                                </p>
                                <ul className="flex flex-col gap-3 pt-1">
                                    <li className="flex items-center gap-3 text-sm font-semibold text-[#191c1e]">
                                        <Link2 className="size-4 shrink-0 text-[#006d36]" aria-hidden />
                                        QR Codes on Packaging
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-semibold text-[#191c1e]">
                                        <Link2 className="size-4 shrink-0 text-[#006d36]" aria-hidden />
                                        Link-in-Bio via Instagram
                                    </li>
                                </ul>
                            </div>
                            <div className="mx-auto w-full max-w-[290px] shrink-0 rounded-3xl border-4 border-[rgba(0,109,54,0.2)] bg-white p-5 shadow-lg sm:mx-0">
                                <div className="aspect-square overflow-hidden rounded-lg">
                                    <SafeImage
                                        src={IMG_QR_LINKING}
                                        alt="Business cards with QR codes linking to Gidira"
                                        className="size-full object-cover"
                                        fallbackLabel="QR preview"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content calendar — Figma 594:8209 */}
                    <div className="flex flex-col gap-8 pt-2">
                        <div className="text-center">
                            <h2 className="text-2xl font-extrabold text-[#191c1e] sm:text-3xl">
                                Creating a Content Calendar
                            </h2>
                            <p className="mx-auto mt-3 max-w-xl text-base text-[#44474d]">
                                Consistency beats intensity. Follow this weekly theme to keep your audience engaged.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 lg:gap-4">
                            {CALENDAR_DAYS.map(
                                ({ day, theme, themeLines, borderMuted, pbClass }) => (
                                    <div
                                        key={day}
                                        className={cn(
                                            "flex flex-col gap-2 rounded-3xl bg-[#f3f4f6] px-4 pt-7 text-center lg:px-6",
                                            borderMuted ? "border-t-4 border-[rgba(0,109,54,0.6)]" : "border-t-4 border-[#006d36]",
                                            pbClass ?? "pb-6",
                                        )}
                                    >
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[#006d36]">
                                            {day}
                                        </span>
                                        {themeLines ? (
                                            <div className="text-base font-bold text-[#191c1e]">
                                                <span className="block leading-snug">{themeLines[0]}</span>
                                                <span className="block leading-snug">{themeLines[1]}</span>
                                            </div>
                                        ) : (
                                            <span className="text-base font-bold leading-snug text-[#191c1e]">
                                                {theme}
                                            </span>
                                        )}
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    {/* CTA — Figma 594:8251 */}
                    <div className="rounded-3xl border-2 border-[#d1fae5] bg-[#eff6ff] px-6 py-12 text-center sm:px-12 sm:py-16">
                        <h2 className="text-2xl font-bold tracking-tight text-[#191b23] sm:text-4xl sm:leading-tight">
                            Ready to Put These Tips Into Action?
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#44474d] sm:text-lg">
                            Your business deserves to be seen. Apply these strategies today and watch your Gidira
                            traffic soar.
                        </p>
                        <Button
                            asChild
                            className="mt-8 h-12 rounded-lg bg-[#158de0] px-8 text-base font-medium text-white hover:bg-[#158de0]/90"
                        >
                            <Link to="/login">Update My Profile</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}

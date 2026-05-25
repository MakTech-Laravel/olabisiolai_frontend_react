import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Sparkles,
  Sun,
  Upload,
  Utensils,
  Wrench,
  Shirt,
} from "lucide-react";

import { container } from "@/lib/container";
import { cn } from "@/lib/utils";

// Image Constants - Replace these with your actual paths
const HERO_IMAGE = "/images/feature/1-2.jpg";
const PRODUCT_IN_USE_IMAGE = "/images/feature/1-4.jpg";

const RECOMMENDED_APPS = [
  { 
    name: "Snapseed", 
    image: "/images/apps/Background (1).png" // Add your image here
  },
  { 
    name: "Lightroom Mobile", 
    image: "/images/apps/Background (2).png" // Add your image here
  },
  { 
    name: "Adobe Express", 
    image: "/images/apps/Background (3).png" // Add your image here
  },
];

export default function PhotosThatSell() {
  return (
    <div className="w-full bg-background">
      {/* Header Section */}
      <section className="relative overflow-hidden bg-ink py-14 sm:py-20 lg:py-28">
        <div className={cn(container, "relative z-10 flex flex-col items-center text-center")}>
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-success/20 text-success">
            <Camera className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-ice sm:text-4xl lg:text-6xl">Photos That Sell</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-stat-muted sm:text-base sm:leading-7 lg:text-2xl lg:leading-10">
            Learn how to take professional-quality photos that attract more customers and
            build trust for your Nigerian business.
          </p>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-6">
        <div className={cn(container)}>
          <Link
            to="/business-tips"
            className="inline-flex items-center gap-2 text-sm font-medium text-body-secondary hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Business Tips
          </Link>
        </div>
      </section>

      <section className="pb-10 lg:pb-16">
        <div className={cn(container, "space-y-8 lg:space-y-12")}>
          
          {/* Why Photos Matter */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Why Photos Matter</h2>
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <div className="space-y-4 text-base leading-7 text-body-secondary sm:text-lg sm:leading-8">
                <p>
                  In today's digital marketplace, your photos are your first impression.
                  High-quality imagery doesn't just show what you sell; it communicates
                  professionalism, reliability, and attention to detail.
                </p>
                <p>
                  Studies show that businesses with professional imagery on Gidira see up to{" "}
                  <span className="font-semibold text-success">40% more inquiries</span> than those
                  with low-quality or missing photos.
                </p>
              </div>
              <div className="rounded-2xl bg-card p-2 shadow-md">
                <img
                  src={HERO_IMAGE}
                  alt="Interior of a modern boutique"
                  className="h-56 w-full rounded-xl object-cover sm:h-72"
                />
              </div>
            </div>
            <div className="rounded-r-xl border-l-4 border-success bg-success/10 p-5 sm:p-6">
              <p className="text-sm font-semibold text-ink">Gidira Insight</p>
              <p className="mt-1 text-sm italic leading-6 text-body-secondary sm:text-base">
                &quot;Customers in Nigeria value authenticity. Avoid stock photos whenever possible;
                real photos of your workspace or products build immediate rapport.&quot;
              </p>
            </div>
          </div>

          {/* Equipment Tips */}
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Equipment You Already Have</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Back Camera",
                  text: "Always use the main rear camera. It has significantly higher resolution than the selfie camera.",
                },
                {
                  title: "Clean Lenses",
                  text: "A simple wipe with a soft cloth removes fingerprints that cause hazy or blurry photos.",
                },
                {
                  title: "Multiple Angles",
                  text: "Don’t just take one shot. Capture close-ups, wide views, and the product being used.",
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl bg-muted p-6">
                  <h3 className="text-xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-body-secondary">{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Mastering Light */}
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-ink sm:text-3xl">Mastering Light</h2>
              <div className="h-px flex-1 bg-border-gray" />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-ink">
                  <Sun className="h-5 w-5 text-brand" />
                  Natural vs. Artificial
                </h3>
                <p className="text-base leading-7 text-body-secondary">
                  Natural daylight is your best friend. It provides accurate color
                  representation and soft shadows. Artificial indoor lighting often creates a
                  yellow or green tint that makes products look unappealing.
                </p>
                <div className="rounded-2xl bg-success/10 p-5">
                  <p className="text-sm font-semibold text-success">Lagos Tip</p>
                  <p className="mt-2 text-sm leading-6 text-success">
                    The best light in Lagos is between <span className="font-semibold">7-9am</span>{" "}
                    and <span className="font-semibold">4-6pm</span>. Avoid mid-day sun (12-2pm) as
                    it creates harsh, dark shadows on faces and products.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-card p-6 shadow-md">
                  <h4 className="text-lg font-semibold text-ink">Window Light Technique</h4>
                  <p className="mt-2 text-sm leading-6 text-body-secondary">
                    Place your subject near a window, but not in direct sunlight. Use a white
                    piece of cardboard on the opposite side to bounce light back and fill in
                    shadows.
                  </p>
                </div>
                <div className="rounded-2xl bg-card p-6 shadow-md">
                  <h4 className="text-lg font-semibold text-ink">Avoid Harsh Shadows</h4>
                  <p className="mt-2 text-sm leading-6 text-body-secondary">
                    Never use your phone&apos;s built-in flash. It flattens the image and creates
                    distracting reflections on shiny surfaces.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Composition & Usage */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-ink p-8 text-ice">
              <h3 className="text-2xl font-bold">Composition Basics</h3>
              <ul className="mt-5 space-y-4 text-sm leading-6 text-stat-muted sm:text-base">
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span>
                    <span className="font-semibold">Rule of Thirds:</span> Place your main subject
                    slightly off-center for a more dynamic look.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span>
                    <span className="font-semibold">Clean Backgrounds:</span> Ensure there is no
                    clutter (trash, cables, busy patterns) behind your subject.
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border-2 border-border-gray bg-card p-8">
              <h3 className="text-2xl font-bold text-ink">Show Products in Use</h3>
              <p className="mt-3 text-base leading-7 text-body-secondary">
                Help customers visualize your product in their lives. Instead of just a shoe,
                show someone walking in it.
              </p>
              <img
                src={PRODUCT_IN_USE_IMAGE}
                alt="Lifestyle shot of a wristwatch"
                className="mt-5 h-32 w-full rounded-xl object-cover sm:h-40"
              />
            </div>
          </div>

          {/* Phone Editing Section */}
          <div className="rounded-3xl bg-muted p-6 sm:p-8 lg:p-12">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Editing on Your Phone</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-xl font-semibold text-ink">Recommended Free Apps</h3>
                <div className="mt-4 space-y-3">
                  {RECOMMENDED_APPS.map((app) => (
                    <div
                      key={app.name}
                      className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm"
                    >
                      <div className="h-9 w-9 overflow-hidden rounded-lg bg-surface-soft">
                        <img 
                          src={app.image} 
                          alt={app.name} 
                          className="h-full w-full object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')} 
                        />
                      </div>
                      <p className="font-medium text-ink">{app.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-ink">Basic Adjustments</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    "Brightness: Fix underexposed shots.",
                    "Contrast: Make colors pop.",
                    "Saturation: Enhance natural tones.",
                    "Sharpness: Define fine details.",
                    "Crop: Remove distracting edges.",
                  ].map((line) => (
                    <div
                      key={line}
                      className="rounded-lg bg-card/70 p-3 text-sm font-medium text-ink"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Industry Specific Section */}
          <div className="py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-ink sm:text-4xl">
                Industry Specific Tips
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <IndustryCard 
                Icon={Utensils} 
                title="Food & Restaurants" 
                desc="Shoot from directly above (flat lay) or a 45-degree angle. Garnish for color." 
              />
              <IndustryCard 
                Icon={Shirt} 
                title="Fashion & Clothing" 
                desc="Show texture details. Use models or high-quality mannequins." 
              />
              <IndustryCard 
                Icon={Sparkles} 
                title="Beauty & Salon" 
                desc="Focus on 'Before & After' shots with consistent lighting." 
              />
              <IndustryCard 
                Icon={Wrench} 
                title="Tech & Repair" 
                desc="Show the internal components and the precision of your tools." 
              />
            </div>
          </div>

          {/* Technical Requirements */}
          <div className="rounded-3xl bg-ink p-6 sm:p-8 lg:p-12">
            <h2 className="text-3xl font-bold text-ice">Uploading to Gidira</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                {[
                  ["Cover Photo", "1200 x 400px"],
                  ["Profile Image", "400 x 400px"],
                  ["Gallery Photos", "Min 800 x 800px"],
                ].map(([label, size]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-white/10 pb-3"
                  >
                    <span className="text-base text-ice">{label}</span>
                    <span className="font-mono text-sm text-success">{size}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-white/5 p-5">
                <p className="flex items-center gap-2 text-base font-semibold text-surface-soft">
                  <Sparkles className="h-4 w-4" />
                  Pro Tip: Gallery Organization
                </p>
                <p className="mt-3 text-sm leading-6 text-stat-muted">
                  Group your photos logically. Customers usually look at the first 3 photos in
                  your gallery. Make them your absolute best hero shots.
                </p>
              </div>
            </div>
          </div>

          {/* Final Call to Action */}
          <div className="rounded-3xl border border-success/20 bg-surface-soft px-4 py-10 text-center sm:px-6 lg:px-8 lg:py-14">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl lg:text-5xl">
              Ready to Level Up Your Gidira Profile?
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-body-secondary sm:text-lg sm:leading-8">
              Start implementing these tips today and watch your engagement grow. A better profile
              means better business.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-3 text-sm font-medium text-ice hover:opacity-90 sm:text-base transition-opacity"
            >
              <Upload className="h-4 w-4" />
              Upgrade Your Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sub-component for clean Industry Cards
function IndustryCard({ Icon, title, desc }: { Icon: any, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-body-secondary">
          {desc}
        </p>
      </div>
    </div>
  );
}
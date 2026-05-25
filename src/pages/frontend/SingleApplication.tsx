import { useState } from "react";   

const CheckCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mt-0.5 shrink-0">
    <circle cx="9" cy="9" r="8.5" stroke="#C0392B" />
    <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LocationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#666" />
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="#666" strokeWidth="1.2" />
    <path d="M7 4v3.2l2 1.8" stroke="#666" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const SalaryIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#666" strokeWidth="1.2" />
    <circle cx="7" cy="7" r="1.5" stroke="#666" strokeWidth="1.2" />
  </svg>
);

const BookmarkIcon = ({ saved }: { saved: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill={saved ? "#C0392B" : "none"}>
    <path d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z" stroke="#888" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="15" cy="5" r="2" stroke="#888" strokeWidth="1.5" />
    <circle cx="5" cy="10" r="2" stroke="#888" strokeWidth="1.5" />
    <circle cx="15" cy="15" r="2" stroke="#888" strokeWidth="1.5" />
    <path d="M7 9l6-3M7 11l6 3" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const requirements = [
  "5+ years of experience in product management, preferably in fintech or high-growth SaaS environments.",
  "Proven track record of delivering successful products from concept to scale.",
  "Strong analytical skills with the ability to use data to inform decisions and measure success.",
  "Excellent communication and leadership skills, with experience managing cross-functional stakeholders.",
  "Deep understanding of Agile methodologies and product development frameworks.",
];

export default function JobListing() {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-3">

        {/* Header Card */}
        <div className="bg-white rounded-xl border border-gray-200 px-7 py-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Manager</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <LocationIcon />
                  Lagos, Nigeria [Hybrid]
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon />
                  Full-time
                </span>
                <span className="flex items-center gap-1">
                  <SalaryIcon />
                  ₦1.2M – ₦1.8M / month
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button
                onClick={() => setSaved(!saved)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Save job"
              >
                <BookmarkIcon saved={saved} />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Share job"
              >
                <ShareIcon />
              </button>
            </div>
          </div>
        </div>

        {/* About the Role */}
        <div className="bg-white rounded-xl border border-gray-200 px-7 py-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="block w-1 h-5 bg-red-600 rounded-full"></span>
            About the Role
          </h2>
          <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
            <p>
              At TechFlow, we are building the future of African fintech. As a Senior Product Manager,
              you will be at the heart of our mission to simplify cross-border payments. You'll work
              closely with engineering, design, and marketing teams to define the product vision and
              drive execution.
            </p>
            <p>
              This is a strategic role requiring a deep understanding of customer pain points, market
              trends, and technical possibilities. You will manage the entire lifecycle of key product
              features from ideation to launch and beyond.
            </p>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 px-7 py-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <span className="block w-1 h-5 bg-red-600 rounded-full"></span>
            Requirements
          </h2>
          <ul className="space-y-3.5">
            {requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed">
                <CheckCircleIcon />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => setApplied(true)}
          className={`w-full py-4 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 ${
            applied
              ? "bg-green-600 text-white cursor-default"
              : "bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white"
          }`}
          disabled={applied}
        >
          {applied ? "✓ Application Submitted" : "Apply Now"}
        </button>

      </div>
    </div>
  );
}
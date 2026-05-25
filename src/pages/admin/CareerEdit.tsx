import { useState } from "react";
import { alert } from "@/lib/sweetAlert";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  Briefcase,
  ShoppingCart,
  MapPin,
  Banknote,
  FileText,
  Clock,
} from "lucide-react";

type JobType = "Full-Time" | "Part-Time" | "Contract" | "Remote";

type Designation = {
  id: number;
  title: string;
  category: string;
  location: string;
  salary: string;
  description: string;
  type: JobType;
};

const MAX_DESC = 1000;

export default function CareerEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const designation = location.state?.designation as Designation | undefined;
  const isEditMode = Boolean(designation);

  const [title, setTitle] = useState(designation?.title || "");
  const [category, setCategory] = useState(designation?.category || "");
  const [locationValue, setLocationValue] = useState(designation?.location || "");
  const [salary, setSalary] = useState(designation?.salary || "");
  const [description, setDescription] = useState(designation?.description || "");
  const [type, setType] = useState<JobType>(designation?.type || "Full-Time");

  const handleSave = () => {
    if (isEditMode) {
      alert.crud.updated("Job posting");
    } else {
      alert.crud.created("Job posting");
    }
    navigate("/admin/career");
  };

  const handleCancel = () => {
    navigate("/admin/career");
  };

  return (
    <div className=" bg-slate-100/70 font-sans">
      <div className="mx-auto max-w-9xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-100">

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 px-7 py-5">
          <button
            onClick={handleCancel}
            className="flex size-10 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition"
          >
            <ChevronLeft className="size-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-slate-900">
              {isEditMode ? "Edit Post" : "Add Post"}
            </h1>
            <p className="mt-0.5 text-xs text-slate-400">
              {isEditMode
                ? "Edit the details of the job listing"
                : "Fill in the details to create a new job listing"}
            </p>
          </div>
        </div>

        {/* Form body */}
        <div className="flex flex-col gap-5 px-7 py-6">

          {/* Designation name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Designation Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Product Manager"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-11 text-[13.5px] text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
              />
              <Briefcase className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-300" />
            </div>
          </div>

          {/* Category + Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Category</label>
              <div className="relative">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-11 text-[13.5px] text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
                />
                <ShoppingCart className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Type</label>
              <div className="relative">
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value as JobType)}
                  placeholder="e.g. Full-Time"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-28 text-[13.5px] text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-500">
                  <span className="size-1.5 rounded-full bg-blue-500" />
                  {type}
                </span>
              </div>
            </div>
          </div>

          {/* Location + Salary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Location</label>
              <div className="relative">
                <input
                  type="text"
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  placeholder="e.g. Lagos, Nigeria"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 pr-11 text-[13.5px] text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
                />
                <MapPin className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Salary Range</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400">
                  ₦
                </span>
                <input
                  type="text"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 1.2M – 1.8M"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3 pl-8 pr-11 text-[13.5px] text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
                />
                <Banknote className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Description</label>
            <div className="relative">
              <textarea
                rows={6}
                maxLength={MAX_DESC}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and requirements…"
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-[13.5px] leading-relaxed text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white"
              />
              <FileText className="absolute right-3.5 top-3.5 size-4 text-slate-300" />
            </div>
            <div className="flex justify-end">
              <span
                className={`text-[11.5px] font-medium ${description.length > 900 ? "text-red-400" : "text-slate-400"
                  }`}
              >
                {description.length} / {MAX_DESC}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-7 py-4">
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-[#158DE0] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:-translate-y-px active:scale-97"
          >
            {/* <Send className="size-3.5" /> */}
            {isEditMode ? "Update" : "Publish"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
          >
            Cancel
          </button>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="size-3.5" />
            Draft auto-saved
          </div>
        </div>

      </div>
    </div>
  );
}
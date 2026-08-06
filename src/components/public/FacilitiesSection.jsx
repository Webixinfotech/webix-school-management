import { Smile, BookOpen, Palette, Brain } from "lucide-react";

const facilities = [
  {
    icon: Smile,
    title: "Playzone",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: BookOpen,
    title: "Library",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    icon: Palette,
    title: "Art Studio",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  {
    icon: Brain,
    title: "Brain Lab",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
];

export default function FacilitiesSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Our Facilities
          </h2>
          <p className="mt-2 text-slate-600">Designed for young learners</p>
        </div>

        {/* Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {facilities.map(({ icon: Icon, title, iconBg, iconColor }) => (
            <div
              key={title}
              className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-100 text-center
                         transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Icon Box */}
              <div
                className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center ${iconBg}`}
              >
                <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={1.8} />
              </div>

              {/* Title */}
              <p className="font-semibold text-slate-800 mt-4 text-base">
                {title}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

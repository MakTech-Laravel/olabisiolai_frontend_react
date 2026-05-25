import { ShieldCheck, Star, MessageSquare, MapPin } from "lucide-react";

export default function WhyChooseGidira() {
  const features = [
    {
      icon: <ShieldCheck size={24} className="text-primary" />,
      bgColor: "bg-primary/10",
      title: "Verified Businesses",
      description:
        "Every listed business goes through ID, CAC, and trust verification checks.",
    },
    {
      icon: <Star size={24} className="text-destructive" />,
      bgColor: "bg-destructive/10",
      title: "Trusted Reviews",
      description:
        "Real reviews from real customers help you make confident decisions.",
    },
    {
      icon: <MessageSquare size={24} className="text-success" />,
      bgColor: "bg-success/10",
      title: "Direct Contact",
      description:
        "Connect instantly with businesses via WhatsApp - no middleman needed.",
    },
    {
      icon: <MapPin size={24} className="text-destructive" />,
      bgColor: "bg-destructive/10",
      title: "Local Search",
      description:
        "Find businesses by State, LGA, and Area for accurate local results.",
    },
  ];

  return (
    <div className="bg-bg-section lg:py-20 py-12">
      <div className="container mx-auto px-4">
        <h2 className="lg:text-4xl text-1xl font-inter font-extrabold text-text-primary text-center mb-4">
          Why Choose GIDIRA?
        </h2>
        <p className="text-lg text-text-secondary text-center mb-16">
          Nigeria's most trusted platform for finding verified businesses
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-lg shadow-sm flex flex-col items-start text-left"
            >
              <div className={`p-3 rounded-lg ${feature.bgColor} mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-inter font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-text-secondary text-sm font-inter leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

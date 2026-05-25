export default function HowGidiraWorks() {
  const steps = [
    {
      id: 1,
      title: "Search",
      description: "Search for a service or browse categories to find what you need.",
    },
    {
      id: 2,
      title: "Compare",
      description: "View verified profiles, read reviews, and compare service providers.",
    },
    {
      id: 3,
      title: "Contact",
      description: "Reach out directly via WhatsApp or phone to discuss your needs.",
    },
    {
      id: 4,
      title: "Review",
      description: "Leave a review to help others find great services too.",
    },
  ];

  return (
    <div className="bg-card lg:py-10 py-0">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="lg:text-4xl text-2xl font-inter font-extrabold text-text-primary text-center mb-4">
          How Gidira Works
        </h2>
        <p className="text-lg text-text-secondary text-center mb-16">
          Finding trusted businesses has never been easier
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mb-4">
                {step.id}
              </div>
              <h3 className="text-xl font-inter font-semibold text-text-primary mb-2">
                {step.title}
              </h3>
              <p className="text-text-secondary text-sm font-inter leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
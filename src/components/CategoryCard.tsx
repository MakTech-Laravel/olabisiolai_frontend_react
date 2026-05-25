import * as LucideIcons from "lucide-react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  name: string;
  icon: string;
  to?: string;
  onClick?: () => void;
}

export function CategoryCard({ name, icon, to, onClick }: CategoryCardProps) {
  const IconComponent = (LucideIcons as any)[icon];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      // Navigation will be handled by Link component
    } else {
      // Default behavior - navigate to category page
      console.log(`Clicked on ${name} category`);
    }
  };

  const cardContent = (
    <div
      onClick={handleClick}
      className="flex flex-col items-center gap-2 py-6 px-4 bg-bg-section rounded-2xl hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
    >
      <div className="p-4 bg-card rounded-full">
        {IconComponent && <IconComponent className="w-8 h-8 text-text-primary" />}
      </div>
      <p className="text-base font-inter text-text-primary font-medium text-center">
        {name}
      </p>
    </div>
  );

  // If 'to' prop is provided, wrap with Link, otherwise render as div
  if (to) {
    return (
      <Link to={to}>
        {cardContent}
      </Link>
    );
  }

  return <div>{cardContent}</div>;
}

import { cn } from "@/lib/utils";
export function BoostPlanHeader() {
  return (
    <div className={cn('flex', 'flex-wrap', 'items-start', 'justify-between', 'gap-3')}>
      <div>
        <button className={cn('bg-[#C2FFE0]', 'rounded-3xl', 'px-2', 'py-2', 'text-sm', 'font-medium', 'my-2')}>GROWTH ENGINE</button>
        <h2 className={cn('text-4xl', 'font-extrabold', 'font-manrope', 'tracking-tight', 'text-foreground', 'mb-4')}>
          Boost Your Business
        </h2>
        <p className={cn('max-w-9xl', 'text-md', 'font-inter', 'font-medium', 'text-muted-foreground')}>
          Increase your visibility and reach the top of search results in your chosen LGA. Boosting helps you reach more customers, get more enquiries, and stand out from competitors in your area.
        </p>
      </div>

    </div>
  );
} 

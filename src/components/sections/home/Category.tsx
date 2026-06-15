import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { CategoryCard } from "@/components/CategoryCard";
import { selectHomeCategories } from "@/features/categories/homeFeaturedCategories";
import { lucideIconForCategoryName } from "@/features/categories/iconForCategoryName";
import { useCategoryCatalog } from "@/features/categories/useCategoryCatalog";

export function Category() {
  const { data: categories = [], isPending, isError, refetch } = useCategoryCatalog();
  const homeCategories = selectHomeCategories(categories);

  return (
    <div className="mb-20">
      <div className="container mx-auto px-4">
        <div className="">
          <h2 className="lg:text-3xl text-2xl font-inter font-bold text-text-primary text-center">Browse by Category</h2>
        </div>
        <div className="mt-12">
          {isPending ? (
            <div className="flex justify-center py-16 text-text-secondary">
              <Loader2 className="size-9 animate-spin" aria-hidden />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-text-secondary">
              <p>Categories could not be loaded.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-3 text-primary font-medium underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : homeCategories.length === 0 ? (
            <p className="text-center text-sm text-text-secondary py-12">No categories yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-7">
              {homeCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  name={category.name}
                  icon={lucideIconForCategoryName(category.name)}
                  to={`/filters?category_id=${category.id}`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="mt-8 text-center">
          <Link to="/filters" className="bg-primary text-primary-foreground font-inter font-medium text-lg px-4 py-3 rounded-xl">All Categories</Link>
        </div>
      </div>
    </div>
  );
}

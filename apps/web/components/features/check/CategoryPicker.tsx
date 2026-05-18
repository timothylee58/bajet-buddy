"use client";

import { CATEGORIES, type CategoryId } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CategoryPickerProps {
  selected: CategoryId;
  onChange: (id: CategoryId) => void;
}

export function CategoryPicker({ selected, onChange }: CategoryPickerProps) {
  return (
    <div>
      <p className="text-xs text-muted mb-2 font-medium">Category</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id as CategoryId)}
            data-testid={`category-${cat.id}`}
            className={cn(
              "flex-shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-colors border",
              selected === cat.id
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted border-border hover:border-primary/40"
            )}
          >
            <span className="text-lg leading-none">{cat.emoji}</span>
            <span className="whitespace-nowrap">{cat.name.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

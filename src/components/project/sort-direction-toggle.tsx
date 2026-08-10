"use client";

import { Button } from "@/components/ui/button";
import type { SortDirection } from "@/lib/sort-projects";

type SortDirectionToggleProps = {
  value: SortDirection;
  onChange: (v: SortDirection) => void;
};

const options: { value: SortDirection; label: string }[] = [
  { value: "desc", label: "최신순" },
  { value: "asc", label: "오래된순" },
];

function SortDirectionToggle({ value, onChange }: SortDirectionToggleProps) {
  return (
    <div role="group" aria-label="정렬 방향" className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "default" : "outline"}
          size="sm"
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}

export { SortDirectionToggle };

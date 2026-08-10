"use client";

import { Button } from "@/components/ui/button";

type TechStackFilterProps = {
  options: string[];
  selected: string[];
  onToggle: (tech: string) => void;
  onClear: () => void;
};

function TechStackFilter({
  options,
  selected,
  onToggle,
  onClear,
}: TechStackFilterProps) {
  return (
    <div role="group" aria-label="기술스택 필터" className="flex flex-wrap gap-1.5">
      {options.map((tech) => {
        const isSelected = selected.includes(tech);

        return (
          <Button
            key={tech}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            aria-pressed={isSelected}
            onClick={() => onToggle(tech)}
          >
            {tech}
          </Button>
        );
      })}
      {selected.length > 0 ? (
        <Button variant="ghost" size="sm" onClick={onClear}>
          필터 초기화
        </Button>
      ) : null}
    </div>
  );
}

export { TechStackFilter };

import { Badge } from "@/components/ui/badge";

function TechStackBadges({ techStack }: { techStack: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {techStack.map((tech) => (
        <Badge key={tech} variant="secondary">
          {tech}
        </Badge>
      ))}
    </div>
  );
}

export { TechStackBadges };

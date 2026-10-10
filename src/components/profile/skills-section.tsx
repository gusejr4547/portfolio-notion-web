import { Badge } from "@/components/ui/badge";
import { SKILLS_PROPERTY, type SkillGroup } from "@/types/profile";

/** 분야별 기술 스택. "많이 해봤어요"는 채운 배지, "해본 적 있어요"는 윤곽선 배지로 구분한다. */
function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Badge>{SKILLS_PROPERTY.proficient}</Badge>
        </span>
        <span className="flex items-center gap-1.5">
          <Badge variant="outline">{SKILLS_PROPERTY.familiar}</Badge>
        </span>
      </p>
      <dl className="flex flex-col gap-3">
        {groups.map((group) => (
          <div
            key={group.category}
            className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <dt className="w-24 shrink-0 text-sm font-medium">{group.category}</dt>
            <dd className="flex flex-wrap gap-1.5">
              {group.proficient.map((skill) => (
                <Badge key={`proficient-${skill}`}>{skill}</Badge>
              ))}
              {group.familiar.map((skill) => (
                <Badge key={`familiar-${skill}`} variant="outline">
                  {skill}
                </Badge>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export { SkillsSection };

import { Card } from "@/components/ui";
import Icon, { type IconName } from "@/components/Icon";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconName;
  subtitle?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  subtitle,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <article className="flex flex-col items-center text-center">
        <figure className="flex-shrink-0 mb-3">
          <div
            className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center"
            aria-hidden="true"
          >
            <Icon name={icon} className="w-6 h-6 text-primary" />
          </div>
        </figure>
        <dl className="flex-1 w-full">
          <dt className="text-sm font-medium text-muted-foreground break-words">
            {title}
          </dt>
          <dd className="text-2xl font-bold text-foreground mt-1">
            {value}
          </dd>
          {subtitle && (
            <dd className="text-xs text-muted-foreground mt-1 break-words">
              {subtitle}
            </dd>
          )}
        </dl>
      </article>
    </Card>
  );
}


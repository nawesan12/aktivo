import { cn } from "@/lib/utils";

/**
 * The heading every panel screen opens with.
 *
 * Four screens wrote it as `text-2xl font-bold tracking-tight` and the rest as
 * `text-2xl font-heading font-bold`, with subtitles at two different sizes and
 * spacings, so moving between them the title moved. This is the design's: 21px,
 * tight tracking, a 12.5px line underneath.
 */
export function PanelHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-[22px] flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h1 className="text-[21px] font-bold tracking-[-0.025em]">{title}</h1>
        {subtitle && <p className="mt-[3px] text-[12.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

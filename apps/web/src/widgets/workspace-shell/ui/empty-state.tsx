import { SparkIcon } from "@/shared/ui/tracker-icons";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-black/[0.12] bg-white/72 px-6 py-12 text-center shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0e6] text-accent">
        <SparkIcon size={18} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text/60">{description}</p>
      {action ? <p className="mt-3 text-sm font-semibold text-accent">{action}</p> : null}
    </div>
  );
}

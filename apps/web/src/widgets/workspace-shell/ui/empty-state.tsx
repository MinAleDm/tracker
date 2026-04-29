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
    <div className="border-y border-black/[0.08] py-10 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#f4efe6] text-accent">
        <SparkIcon size={18} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text/60">{description}</p>
      {action ? <p className="mt-3 text-sm font-semibold text-accent">{action}</p> : null}
    </div>
  );
}

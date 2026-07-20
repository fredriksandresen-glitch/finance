export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">{title}</h1>
        <p className="mt-2 max-w-3xl text-zinc-600 dark:text-zinc-300">{description}</p>
      </div>
      {action}
    </div>
  );
}

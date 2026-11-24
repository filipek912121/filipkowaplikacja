import { getT } from "@/lib/i18n/server";
export default async function Loading() {
  const t = await getT();
  return (
    <div className="space-y-6" aria-busy="true" aria-label={t("Loading")}>
      <div className="skeleton h-10 w-64 rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

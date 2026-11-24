import { getT } from "@/lib/i18n/server";
import { Info } from "lucide-react";

export async function DemoBanner() {
  const t = await getT();
  return (
    <div className="border-b border-line bg-electric/[0.07] px-4 py-2 text-center text-xs text-blue-200">
      <Info className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" aria-hidden />
      {t("Demo mode — sample data stored in server memory. Connect Supabase to enable real accounts.")}
    </div>
  );
}

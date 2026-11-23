import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md animate-rise">
        <Link href="/" className="mb-8 flex justify-center" aria-label="PROOFIT home">
          <Logo size={36} />
        </Link>
        <div className="glass-strong neon-border rounded-3xl p-6 shadow-2xl sm:p-8">{children}</div>
      </div>
    </main>
  );
}

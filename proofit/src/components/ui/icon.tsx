import {
  Award,
  BookOpen,
  Crown,
  Dumbbell,
  Flame,
  HeartHandshake,
  Leaf,
  type LucideIcon,
  Mountain,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Target,
  Users,
  Wallet,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Award,
  BookOpen,
  Crown,
  Dumbbell,
  Flame,
  HeartHandshake,
  Leaf,
  Mountain,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Swords,
  Target,
  Users,
  Wallet,
};

/** Renders a lucide icon from a string name stored in config/DB. */
export function Icon({ name, className, "aria-hidden": ariaHidden = true }: { name: string; className?: string; "aria-hidden"?: boolean }) {
  const C = MAP[name] ?? Award;
  return <C className={className} aria-hidden={ariaHidden} />;
}

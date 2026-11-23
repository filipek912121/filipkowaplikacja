export const NAV = [
  { href: "/dashboard", label: "Home", icon: "House" },
  { href: "/explore", label: "Explore", icon: "Compass" },
  { href: "/create", label: "Create", icon: "CirclePlus" },
  { href: "/duels", label: "Duels", icon: "Swords" },
  { href: "/squads", label: "Squads", icon: "Users" },
  { href: "/leaderboard", label: "Rankings", icon: "Trophy" },
  { href: "/achievements", label: "Achievements", icon: "Award" },
  { href: "/review", label: "Verify proofs", icon: "ShieldCheck" },
  { href: "/profile", label: "Profile", icon: "User" },
] as const;

export const BOTTOM_NAV = ["/dashboard", "/explore", "/create", "/leaderboard", "/profile"] as const;

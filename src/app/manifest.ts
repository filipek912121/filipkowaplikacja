import type { MetadataRoute } from "next";

/** Web app manifest: lets PROOFIT be installed on a phone's home screen (PWA). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PROOFIT — Challenge. Compete. Win.",
    short_name: "PROOFIT",
    description: "Wyzwania, pojedynki i rankingi ze znajomymi. Challenges, duels and leaderboards with friends.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090F",
    theme_color: "#09090F",
    lang: "pl",
    categories: ["health", "lifestyle", "social", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Check-in", url: "/dashboard" },
      { name: "Odkrywaj / Explore", url: "/explore" },
      { name: "Ranking", url: "/leaderboard" },
    ],
  };
}

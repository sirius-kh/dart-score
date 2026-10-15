import type { MetadataRoute } from "next";

/** Утасны нүүр дэлгэцэд суулгаж, браузерын хаяг мөргүй бүтэн дэлгэцээр нээх (PWA) */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Дартсын оноо",
    short_name: "Дартс",
    description: "X01 (301/501/701) дартсын оноо бодогч",
    lang: "mn",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#10151f",
    theme_color: "#10151f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/__forms.html",
        "/agenda",
        "/chat",
        "/clienti",
        "/configurazione",
        "/dashboard",
        "/dashboardcoach",
        "/grazie",
        "/login",
        "/magazzino",
        "/marketing",
        "/ruota",
        "/team",
        "/vendite",
      ],
    },
    sitemap: "https://gestionalesalonpro.com/sitemap.xml",
  };
}

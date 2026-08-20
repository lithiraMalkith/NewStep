import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/order/"] },
    sitemap: "https://newstepfootwear.lk/sitemap.xml",
  };
}

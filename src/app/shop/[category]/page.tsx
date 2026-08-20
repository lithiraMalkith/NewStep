import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopBrowser from "@/components/ShopBrowser";
import { byCategory, categories } from "@/lib/products";

const COPY: Record<string, { heading: string; intro: string; title: string; description: string }> = {
  mens: {
    heading: "Men's Shoes",
    intro: "Runners, lifestyle sneakers and formal leather — EU 39 to 46.",
    title: "Men's Shoes Online Sri Lanka",
    description: "Men's running, lifestyle and formal footwear with cash on delivery island-wide.",
  },
  womens: {
    heading: "Women's Shoes",
    intro: "Court sneakers, everyday casuals and slides — EU 36 to 41.",
    title: "Women's Shoes Online Sri Lanka",
    description: "Women's sneakers, casuals and slides with live size stock and cash on delivery.",
  },
  kids: {
    heading: "Kids' Shoes",
    intro: "School-ready and play-proof, sized EU 28 to 33.",
    title: "Kids' Shoes Online Sri Lanka",
    description: "Kids' school and play footwear delivered island-wide, pay cash on delivery.",
  },
  sale: {
    heading: "Sale",
    intro: "Final sizes and last-season colourways at reduced prices.",
    title: "Shoe Sale Sri Lanka",
    description: "Discounted footwear while stock lasts. Final sizes, no restock, cash on delivery.",
  },
};

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const copy = COPY[category];
  if (!copy) return {};
  return { title: copy.title, description: copy.description };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const copy = COPY[category];
  if (!copy) notFound();

  return (
    <ShopBrowser
      products={byCategory(category)}
      heading={copy.heading}
      intro={copy.intro}
    />
  );
}

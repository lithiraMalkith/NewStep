import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { LKR } from "@/lib/format";
import { totalStock } from "@/lib/products";
import { ShoppingBag } from "lucide-react";
import ClientProductRating from "./ClientProductRating";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const stock = totalStock(product);
  const lowStock = stock > 0 && stock <= 6;

  return (
    <div className="group block h-full flex flex-col">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-mist rounded-xl mb-4">
        {/* Main Image */}
        <Image
          src={product.images[0]!}
          alt={`${product.name} — ${product.colour}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
        />
        
        {/* Hover Image (if exists) */}
        {product.images[1] && (
          <Image
            src={product.images[1]!}
            alt={`${product.name} — ${product.colour} alternate view`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 absolute inset-0"
          />
        )}

        <div className="absolute inset-0 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/5" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5 z-10">
          {product.compareAtPrice && (
            <span className="eyebrow bg-sale px-2 py-1 text-paper rounded-full text-[10px]">Sale</span>
          )}
          {product.isNew && !product.compareAtPrice && (
            <span className="eyebrow bg-ink px-2 py-1 text-paper rounded-full text-[10px]">New In</span>
          )}
          {stock === 0 && (
            <span className="eyebrow bg-paper px-2 py-1 text-ink rounded-full text-[10px]">Sold Out</span>
          )}
          {product.isBestseller && (
            <span className="eyebrow bg-[#C9A84C] px-2 py-1 text-ink rounded-full text-[10px]">Best Seller</span>
          )}
        </div>

        {/* Quick Action (Desktop Hover) */}
        <div className="absolute bottom-4 left-0 right-0 px-4 translate-y-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hidden md:block z-10">
          <div className="w-full bg-paper/90 backdrop-blur-md text-ink text-sm font-medium py-3 rounded-full flex items-center justify-center gap-2 hover:bg-ink hover:text-paper transition-colors shadow-sm">
            <ShoppingBag className="w-4 h-4" />
            Quick View
          </div>
        </div>
      </Link>

      <Link href={`/product/${product.slug}`} className="flex flex-col flex-1 px-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-medium leading-snug line-clamp-1 group-hover:underline underline-offset-4">{product.name}</h3>
          <p className="whitespace-nowrap text-[15px] font-medium shrink-0">
            {LKR(product.price)}
          </p>
        </div>
        
        <p className="mt-1 text-sm text-muted">{product.subtitle}</p>
        <p className="text-sm text-muted">{product.colour}</p>
        
        {/* Rating */}
        <ClientProductRating productId={product.id} />

        <div className="mt-auto pt-2 flex items-center gap-2">
          {product.compareAtPrice && (
            <p className="text-sm text-muted line-through">
              {LKR(product.compareAtPrice)}
            </p>
          )}
          {lowStock && (
            <p className="text-xs font-medium text-sale bg-sale/10 px-2 py-0.5 rounded text-left inline-block">
              Only {stock} left
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

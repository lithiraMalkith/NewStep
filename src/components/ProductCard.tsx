import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { LKR } from "@/lib/format";
import { totalStock } from "@/lib/products";

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
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-mist">
        <Image
          src={product.images[0]!}
          alt={`${product.name} — ${product.colour}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.compareAtPrice && (
            <span className="eyebrow bg-sale px-2 py-1 text-paper">Sale</span>
          )}
          {product.isNew && !product.compareAtPrice && (
            <span className="eyebrow bg-ink px-2 py-1 text-paper">New In</span>
          )}
          {stock === 0 && (
            <span className="eyebrow bg-paper px-2 py-1">Sold Out</span>
          )}
        </div>
      </div>

      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-medium leading-snug">{product.name}</h3>
          <p className="whitespace-nowrap text-[15px] font-medium">
            {LKR(product.price)}
          </p>
        </div>
        <p className="mt-0.5 text-sm text-muted">{product.subtitle}</p>
        <p className="text-sm text-muted">{product.colour}</p>
        {product.compareAtPrice && (
          <p className="mt-1 text-sm text-muted line-through">
            {LKR(product.compareAtPrice)}
          </p>
        )}
        {lowStock && (
          <p className="mt-1 text-sm font-medium text-sale">
            Only {stock} left in stock
          </p>
        )}
      </div>
    </Link>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/utils/format";
import { getProductImage } from "@/lib/utils/product-image";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const imageSrc = getProductImage(product);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-blush-pink/20">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          priority={priority}
        />
      </div>
      <div className="mt-4 px-1">
        <h3 className="text-[14px] tracking-wide text-deep-charcoal/80 group-hover:text-deep-charcoal transition-colors">
          {product.name}
        </h3>
        <p className="mt-1.5 font-price text-[15px] tracking-wide text-deep-charcoal">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}

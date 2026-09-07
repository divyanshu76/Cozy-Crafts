"use client";
import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { UploadedImage } from "./product-image-uploader";

interface ProductPreviewProps {
  name: string;
  price: number;
  compareAtPrice?: number;
  shortDescription: string;
  categoryName: string;
  colors: string[];
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  images: UploadedImage[];
}

export function ProductPreview({
  name,
  price,
  compareAtPrice,
  shortDescription,
  categoryName,
  colors,
  isFeatured,
  isNew,
  isBestSeller,
  isActive,
  images,
}: ProductPreviewProps) {
  const [activeImg, setActiveImg] = React.useState(0);

  // Reset active image when images change
  React.useEffect(() => {
    setActiveImg(0);
  }, [images.length]);

  const mainImage = images[activeImg]?.previewUrl ?? images[0]?.previewUrl ?? null;
  const discount =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  return (
    <div className="sticky top-8">
      <p className="text-xs text-espresso-soft uppercase tracking-widest mb-4 font-medium">
        Live Preview
      </p>

      <div className="bg-white rounded-2xl border border-taupe/20 shadow-sm overflow-hidden">
        {/* Image area */}
        <div className="relative bg-cream-soft aspect-[4/3] overflow-hidden">
          {mainImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mainImage}
              alt={name || "Product"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-taupe">
              <ShoppingBag className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-xs opacity-50">No image yet</p>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isNew && (
              <span className="bg-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                New
              </span>
            )}
            {isFeatured && (
              <span className="bg-gold text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                Featured
              </span>
            )}
            {isBestSeller && (
              <span className="bg-espresso text-cream text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                Best Seller
              </span>
            )}
            {discount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide">
                {discount}% off
              </span>
            )}
          </div>

          {!isActive && (
            <div className="absolute top-3 right-3 bg-gray-800/70 text-white text-[10px] px-2 py-0.5 rounded">
              Inactive
            </div>
          )}
        </div>

        {/* Thumbnail row */}
        {images.length > 1 && (
          <div className="flex gap-2 px-4 py-2 border-b border-taupe/10 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.previewUrl}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                  i === activeImg ? "border-espresso" : "border-taupe/20 hover:border-taupe"
                }`}
                aria-label={`View image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Product info */}
        <div className="p-5 space-y-3">
          {/* Category */}
          {categoryName && (
            <p className="text-xs text-espresso-soft uppercase tracking-widest font-medium">
              {categoryName}
            </p>
          )}

          {/* Name */}
          <h3 className="font-serif text-xl text-espresso leading-tight">
            {name || <span className="text-taupe italic">Your product name</span>}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-espresso">
              ₹{price > 0 ? price.toLocaleString("en-IN") : "0"}
            </span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="text-sm text-taupe line-through">
                ₹{compareAtPrice.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {/* Short description */}
          {shortDescription && (
            <p className="text-sm text-espresso-soft leading-relaxed line-clamp-3">
              {shortDescription}
            </p>
          )}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="text-xs text-espresso-soft uppercase tracking-wider mb-2 font-medium">
                Colors
              </p>
              <div className="flex flex-wrap gap-1.5">
                {colors.map((color) => (
                  <span
                    key={color}
                    className="text-xs px-2.5 py-1 rounded-full border border-taupe/30 text-espresso bg-cream-soft"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart preview */}
          <div className="pt-2 border-t border-taupe/10">
            <button
              type="button"
              disabled
              className="w-full h-10 bg-espresso text-cream rounded-lg text-sm font-medium opacity-60 cursor-default"
              aria-hidden="true"
            >
              Add to Cart
            </button>
            <p className="text-center text-xs text-taupe mt-2">Preview only</p>
          </div>
        </div>
      </div>
    </div>
  );
}

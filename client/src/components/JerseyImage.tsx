interface JerseyImageProps {
  primaryColor: string;
  trimColor: string;
  /** Used for the accessible name, e.g. "Arsenal Home". */
  name: string;
  className?: string;
}

/**
 * A jersey silhouette filled with the product's colors. There are no real
 * product photos in this project, so the SVG is the product image.
 *
 * The body carries a faint outline because several kits are pure white
 * (#FFFFFF) against the warm-gray card background — without it those
 * jerseys would be an invisible blob.
 */
export default function JerseyImage({
  primaryColor,
  trimColor,
  name,
  className,
}: JerseyImageProps) {
  return (
    <svg
      viewBox="0 0 200 220"
      className={className}
      role="img"
      aria-label={`${name} jersey`}
      data-testid="jersey-image"
    >
      {/* Body + sleeves */}
      <path
        d="M60 18 L80 10 C88 28, 112 28, 120 10 L140 18 L186 48 L162 92 L146 82 L146 210 L54 210 L54 82 L38 92 L14 48 Z"
        fill={primaryColor}
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Collar */}
      <path
        d="M80 10 C88 28, 112 28, 120 10 L128 14 C118 38, 82 38, 72 14 Z"
        fill={trimColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Sleeve cuffs */}
      <path
        d="M162 92 L186 48 L193 57 L170 100 Z"
        fill={trimColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M38 92 L14 48 L7 57 L30 100 Z"
        fill={trimColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* Hem band */}
      <rect
        x="54"
        y="196"
        width="92"
        height="14"
        fill={trimColor}
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
      />
    </svg>
  );
}

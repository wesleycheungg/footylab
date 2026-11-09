export type JerseyView = 'front' | 'back' | 'collar' | 'cuff';

interface JerseyImageProps {
  primaryColor: string;
  trimColor: string;
  /** Used for the accessible name, e.g. "Arsenal Home". */
  name: string;
  /** Which view to render. Detail views crop the same artwork. */
  view?: JerseyView;
  className?: string;
}

/**
 * A jersey silhouette filled with the product's colors. There are no real
 * product photos in this project, so the SVG is the product image.
 *
 * The body carries a faint outline because several kits are pure white
 * (#FFFFFF) against the warm-gray background — without it those jerseys
 * would be an invisible blob.
 *
 * Because the artwork is vector, the "collar" and "cuff" views are just
 * tighter viewBoxes over the same paths: four genuinely different images
 * for no extra assets, and you can actually inspect the trim.
 */

// Front has an open V-neck; the back is a closed shoulder line.
const FRONT_BODY =
  'M60 18 L80 10 C88 28, 112 28, 120 10 L140 18 L186 48 L162 92 L146 82 L146 210 L54 210 L54 82 L38 92 L14 48 Z';
const BACK_BODY =
  'M60 18 L80 10 L120 10 L140 18 L186 48 L162 92 L146 82 L146 210 L54 210 L54 82 L38 92 L14 48 Z';

const VIEW_BOX: Record<JerseyView, string> = {
  front: '0 0 200 220',
  back: '0 0 200 220',
  collar: '56 0 88 62',
  cuff: '2 34 86 80',
};

const VIEW_LABEL: Record<JerseyView, string> = {
  front: 'front',
  back: 'back',
  collar: 'collar detail',
  cuff: 'sleeve cuff detail',
};

export default function JerseyImage({
  primaryColor,
  trimColor,
  name,
  view = 'front',
  className,
}: JerseyImageProps) {
  const isBack = view === 'back';
  const edge = 'rgba(0,0,0,0.12)';

  return (
    <svg
      viewBox={VIEW_BOX[view]}
      className={className}
      role="img"
      aria-label={`${name} jersey, ${VIEW_LABEL[view]}`}
      data-testid="jersey-image"
      data-view={view}
    >
      {/* Body + sleeves */}
      <path
        d={isBack ? BACK_BODY : FRONT_BODY}
        fill={primaryColor}
        stroke="rgba(0,0,0,0.16)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Collar: an open neckline from the front, taping across the back */}
      {isBack ? (
        <path
          d="M78 10 L122 10 L122 21 L78 21 Z"
          fill={trimColor}
          stroke={edge}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M80 10 C88 28, 112 28, 120 10 L128 14 C118 38, 82 38, 72 14 Z"
          fill={trimColor}
          stroke={edge}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      )}

      {/* Sleeve cuffs */}
      <path
        d="M162 92 L186 48 L193 57 L170 100 Z"
        fill={trimColor}
        stroke={edge}
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path
        d="M38 92 L14 48 L7 57 L30 100 Z"
        fill={trimColor}
        stroke={edge}
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
        stroke={edge}
        strokeWidth="1"
      />
    </svg>
  );
}

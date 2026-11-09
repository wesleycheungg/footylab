import { SIZES, type Size } from '../types';

interface SizeGridProps {
  selected: Size | null;
  soldOut: Set<Size>;
  onSelect: (size: Size) => void;
}

/**
 * Sold-out sizes stay visible rather than being removed: knowing your size
 * is gone is information, and a grid that silently loses options reads as
 * a rendering bug.
 */
export default function SizeGrid({
  selected,
  soldOut,
  onSelect,
}: SizeGridProps) {
  return (
    <div className="size-grid" role="group" aria-label="Size">
      {SIZES.map((size) => {
        const unavailable = soldOut.has(size);

        return (
          <button
            key={size}
            type="button"
            className={`size-grid__option ${
              selected === size ? 'size-grid__option--selected' : ''
            } ${unavailable ? 'size-grid__option--unavailable' : ''}`}
            disabled={unavailable}
            aria-pressed={selected === size}
            aria-label={unavailable ? `Size ${size}, sold out` : `Size ${size}`}
            onClick={() => onSelect(size)}
            data-testid={`size-${size}`}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}

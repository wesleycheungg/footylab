import { useId, useState, type ReactNode } from 'react';

interface ExpandableSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Button + aria-expanded rather than <details>/<summary>: the height
 * animation needs a measurable wrapper, and native <details> snaps open
 * in a way CSS can't smooth reliably across browsers.
 */
export default function ExpandableSection({
  title,
  children,
  defaultOpen = false,
}: ExpandableSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="expandable" data-testid="expandable-section">
      <h2 className="expandable__heading">
        <button
          type="button"
          className="expandable__trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((previous) => !previous)}
          data-testid="expandable-trigger"
        >
          <span>{title}</span>
          <span className="expandable__icon" aria-hidden="true">
            {open ? '−' : '+'}
          </span>
        </button>
      </h2>

      {/* The grid-rows 0fr → 1fr trick animates to auto height without
          hardcoding a max-height that clips longer copy. */}
      <div
        id={panelId}
        className={`expandable__panel ${open ? 'expandable__panel--open' : ''}`}
        role="region"
        aria-label={title}
      >
        {/* `inert` (not `hidden`) keeps collapsed copy out of the tab order
            and the accessibility tree without setting display:none, which
            would stop the transition from running at all. */}
        <div className="expandable__content" inert={!open}>
          {children}
        </div>
      </div>
    </div>
  );
}

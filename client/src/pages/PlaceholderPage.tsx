import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  /** Which phase builds this page for real. */
  phase: string;
}

/**
 * Stands in for routes that exist in the route table but aren't built yet.
 * Keeps the router complete — a missing route is a blank screen, which is
 * much harder to diagnose than an explicit placeholder.
 */
export default function PlaceholderPage({
  title,
  phase,
}: PlaceholderPageProps) {
  return (
    <div className="container page">
      <h1>{title}</h1>
      <div className="placeholder" data-testid="placeholder">
        <p>
          This page arrives in <strong>{phase}</strong>.
        </p>
        <p style={{ marginTop: 'var(--space-3)' }}>
          <Link to="/jerseys" style={{ textDecoration: 'underline' }}>
            Browse jerseys
          </Link>
        </p>
      </div>
    </div>
  );
}

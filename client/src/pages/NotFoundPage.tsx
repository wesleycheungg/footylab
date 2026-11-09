import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container page">
      <h1>Page not found</h1>
      <p className="page__intro">
        That link doesn&apos;t go anywhere. It may have moved, or never existed.
      </p>
      <p style={{ marginTop: 'var(--space-5)' }}>
        <Link to="/jerseys" className="btn">
          Browse all jerseys
        </Link>
      </p>
    </div>
  );
}

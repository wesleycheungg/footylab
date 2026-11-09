import { Link } from 'react-router-dom';

const COLUMNS = [
  {
    heading: 'Shop',
    links: [
      { label: 'Clubs', to: '/jerseys?league=Premier+League' },
      { label: 'National Teams', to: '/jerseys?league=International' },
      { label: 'Retro', to: '/jerseys?kit=Retro' },
      { label: 'Gift Cards', to: '/jerseys' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Size Guide', to: '/jerseys' },
      { label: 'Shipping', to: '/jerseys' },
      { label: 'Returns', to: '/jerseys' },
      { label: 'Contact', to: '/jerseys' },
    ],
  },
  {
    heading: 'FootyLab',
    links: [
      { label: 'Our Story', to: '/' },
      { label: 'Order History', to: '/orders' },
      { label: 'Account', to: '/login' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer" data-testid="footer">
      <div className="container">
        <div className="footer__columns">
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2 className="footer__heading">{column.heading}</h2>
              <ul className="footer__links">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h2 className="footer__heading">Stay in the loop</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
              New kits and restocks, no spam.
            </p>
            {/* Decorative: there is no mailing list behind this. onSubmit is
                prevented so it can't navigate away or look like it worked. */}
            <form
              className="footer__signup"
              onSubmit={(event) => event.preventDefault()}
            >
              <label htmlFor="footer-email" className="visually-hidden">
                Email address
              </label>
              <input
                id="footer-email"
                className="footer__input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
              <button type="submit" className="btn">
                Sign up
              </button>
            </form>
          </div>
        </div>

        <p className="footer__disclaimer" data-testid="footer-disclaimer">
          © 2026 FootyLab. Portfolio project. Not affiliated with any club or
          league. No real products sold.
        </p>
      </div>
    </footer>
  );
}

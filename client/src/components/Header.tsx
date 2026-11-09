import { Link, useLocation } from 'react-router-dom';
import AccountMenu from './AccountMenu';

/**
 * Nav links are filter presets on /jerseys, not separate pages — see the
 * Frontend Routes table in PLAN.md.
 */
const NAV_LINKS = [
  { label: 'Clubs', to: '/jerseys?league=Premier+League' },
  { label: 'National Teams', to: '/jerseys?league=International' },
  { label: 'Retro', to: '/jerseys?kit=Retro' },
  { label: 'New Arrivals', to: '/jerseys?sort=featured' },
];

interface HeaderProps {
  /** Hardcoded to 0 until CartContext lands in Phase 8. */
  cartCount?: number;
}

/**
 * Makes two URLs comparable regardless of param order or whether spaces
 * were encoded as "+" or "%20" — "/jerseys?league=Premier+League" and
 * "/jerseys?league=Premier%20League" are the same destination.
 */
function normalizeUrl(url: string): string {
  const [path, search = ''] = url.split('?');
  const params = new URLSearchParams(search);
  params.sort();
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export default function Header({ cartCount = 0 }: HeaderProps) {
  const location = useLocation();

  // NavLink can't be used here: it compares pathname only, so every preset
  // on /jerseys would highlight at once. Compare the query string too.
  const current = normalizeUrl(`${location.pathname}${location.search}`);
  const isActive = (to: string) => normalizeUrl(to) === current;

  return (
    <header className="header" data-testid="header">
      <div className="container header__inner">
        <Link to="/" className="header__logo" data-testid="header-logo">
          FootyLab
        </Link>

        <nav className="header__nav" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="header__nav-link"
              aria-current={isActive(link.to) ? 'page' : undefined}
              data-testid={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header__actions">
          {/* Phase 10 turns this into a real search field. For now it just
              lands on the shop page, where 4b's filters live. */}
          <Link
            to="/jerseys"
            className="icon-button"
            aria-label="Search jerseys"
            data-testid="search-link"
          >
            <SearchIcon />
          </Link>

          <AccountMenu />

          {/* Phase 8 replaces this with the cart drawer toggle. */}
          <Link
            to="/checkout"
            className="icon-button"
            aria-label={`Cart, ${cartCount} items`}
            data-testid="cart-link"
          >
            <BagIcon />
            {cartCount > 0 && (
              <span className="icon-button__badge" data-testid="cart-count">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Below 900px the main nav is hidden, so repeat it as a scrollable
          row rather than dropping the links entirely. */}
      <div className="container">
        <nav className="header__mobile-nav" aria-label="Categories">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className="header__nav-link"
              aria-current={isActive(link.to) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* Inline 20px icons — no icon library, to keep the bundle and the
   dependency list small. aria-hidden because each has a labelled parent. */

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

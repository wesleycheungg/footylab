import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Global search in the header. Collapsed to an icon until used, so it
 * doesn't crowd the nav.
 *
 * Submitting navigates to /jerseys?q=… and **drops any other filters**.
 * Carrying a league or size over from wherever the shopper happened to be
 * is how you get a search that mysteriously returns nothing — the header
 * search is a fresh intent, and the sidebar is there to narrow it again.
 */
export default function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Seed from the URL so opening search on an already-filtered page shows
  // what is actually being searched for.
  const activeQuery = searchParams.get('q') ?? '';

  function openSearch() {
    // Seeded here rather than in an effect: it's a consequence of the
    // click, not something to synchronise after the fact.
    setTerm(activeQuery);
    setOpen(true);
  }

  function closeSearch() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Focus is genuine DOM work, so it does belong in an effect.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeSearch();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = term.trim();

    // An empty search means "show everything", not "search for nothing".
    navigate(query ? `/jerseys?q=${encodeURIComponent(query)}` : '/jerseys');
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        aria-label={open ? 'Close search' : 'Search jerseys'}
        aria-expanded={open}
        onClick={() => (open ? closeSearch() : openSearch())}
        data-testid="search-toggle"
      >
        <SearchIcon />
      </button>

      {open && (
        <div className="header-search" data-testid="header-search">
          <div className="container">
            <form
              className="header-search__form"
              onSubmit={handleSubmit}
              role="search"
            >
              <label htmlFor="header-search-input" className="visually-hidden">
                Search jerseys
              </label>
              <input
                ref={inputRef}
                id="header-search-input"
                className="header-search__input"
                type="search"
                placeholder="Search teams, leagues or kits…"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                data-testid="header-search-input"
              />
              <button
                type="submit"
                className="btn btn--primary"
                data-testid="header-search-submit"
              >
                Search
              </button>
              <button
                type="button"
                className="btn"
                onClick={closeSearch}
                data-testid="header-search-cancel"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

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

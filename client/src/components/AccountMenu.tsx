import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/userContext';

/**
 * The account icon and its dropdown. Signed out it offers log in and sign
 * up; signed in it shows the address plus order history and log out.
 */
export default function AccountMenu() {
  const { user, status, signOut } = useUser();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();

  // Close on outside click and on Escape — a dropdown you can only
  // dismiss by picking something from it is a trap.
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        // Return focus to the trigger, or the keyboard user is stranded
        // at the top of the document.
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/');
  }

  return (
    <div className="account" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        aria-label={user ? `Account, signed in as ${user.email}` : 'Account'}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((previous) => !previous)}
        data-testid="account-button"
      >
        <UserIcon />
        {status === 'authenticated' && (
          <span className="account__dot" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="account__menu" role="menu" data-testid="account-menu">
          {status === 'authenticated' && user ? (
            <>
              <p className="account__email" data-testid="account-email">
                {user.email}
              </p>
              <Link
                to="/orders"
                role="menuitem"
                className="account__item"
                onClick={() => setOpen(false)}
              >
                Order history
              </Link>
              <button
                type="button"
                role="menuitem"
                className="account__item"
                onClick={handleSignOut}
                data-testid="logout-button"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                role="menuitem"
                className="account__item"
                onClick={() => setOpen(false)}
                data-testid="login-link"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                role="menuitem"
                className="account__item"
                onClick={() => setOpen(false)}
                data-testid="signup-link"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UserIcon() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

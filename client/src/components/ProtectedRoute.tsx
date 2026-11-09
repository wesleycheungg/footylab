import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/userContext';

/**
 * Gate for routes that need an account. Used as a layout route, so it
 * wraps several children without repeating itself per route.
 */
export default function ProtectedRoute() {
  const { status } = useUser();
  const location = useLocation();

  // Critical: while the session check is in flight we are neither signed
  // in nor signed out. Redirecting here would bounce every refresh on a
  // protected page to the login screen, even for a signed-in user.
  if (status === 'loading') {
    return (
      <div className="container page">
        <p className="status-message">Checking your session…</p>
      </div>
    );
  }

  if (status === 'anonymous') {
    return (
      <Navigate
        to="/login"
        replace
        // Remember where they were headed so login can send them back.
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}

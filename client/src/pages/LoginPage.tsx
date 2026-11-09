import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useUser } from '../contexts/userContext';

export default function LoginPage() {
  const { status, signIn } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // ProtectedRoute records where it turned you away, so signing in returns
  // you there instead of dumping you on the home page.
  const destination =
    (location.state as { from?: string } | null)?.from ?? '/';

  if (status === 'authenticated') {
    return <Navigate to={destination} replace />;
  }

  return (
    <AuthForm
      title="Log in"
      intro="Sign in to see your cart and order history."
      submitLabel="Log in"
      pendingLabel="Signing in…"
      footer={{
        prompt: 'New to FootyLab?',
        linkLabel: 'Create an account',
        to: '/signup',
      }}
      onSubmit={async (email, password) => {
        await signIn(email, password);
        // `replace` so Back doesn't return to a login page the user has
        // already passed through.
        navigate(destination, { replace: true });
      }}
    />
  );
}

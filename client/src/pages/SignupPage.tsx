import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useUser } from '../contexts/userContext';

export default function SignupPage() {
  const { status, signUp } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const destination =
    (location.state as { from?: string } | null)?.from ?? '/';

  if (status === 'authenticated') {
    return <Navigate to={destination} replace />;
  }

  return (
    <AuthForm
      title="Create an account"
      intro="You'll need one to save a cart and place an order."
      submitLabel="Create account"
      pendingLabel="Creating account…"
      withConfirmation
      footer={{
        prompt: 'Already have an account?',
        linkLabel: 'Log in',
        to: '/login',
      }}
      onSubmit={async (email, password) => {
        await signUp(email, password);
        navigate(destination, { replace: true });
      }}
    />
  );
}

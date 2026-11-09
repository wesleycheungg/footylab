import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export interface AuthFormProps {
  title: string;
  intro: string;
  /** Text for the submit button in its resting state. */
  submitLabel: string;
  /** Shown on the button while the request is in flight. */
  pendingLabel: string;
  /** Signup asks the password twice; login doesn't. */
  withConfirmation?: boolean;
  footer: { prompt: string; linkLabel: string; to: string };
  onSubmit: (email: string, password: string) => Promise<void>;
}

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shared by login and signup: the two pages differ by one field and the
 * wording, so keeping them as one component stops the validation rules
 * drifting apart from each other — and from the server's.
 */
export default function AuthForm({
  title,
  intro,
  submitLabel,
  pendingLabel,
  withConfirmation = false,
  footer,
  onSubmit,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): string | null {
    if (!EMAIL_PATTERN.test(email.trim())) {
      return 'Enter a valid email address.';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (withConfirmation && password !== confirmation) {
      return 'Passwords do not match.';
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    // Client-side checks are for speed of feedback only. The server
    // validates independently — see routes/auth.ts.
    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }

    setPending(true);
    setError(null);

    try {
      await onSubmit(email.trim(), password);
    } catch (err: unknown) {
      // Surface the server's wording rather than inventing our own: it is
      // the one that knows whether this was a duplicate email, a rate
      // limit, or bad credentials.
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Try again.'
      );
      setPending(false);
    }
  }

  return (
    <div className="container page">
      <div className="auth">
        <h1>{title}</h1>
        <p className="auth__intro">{intro}</p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label className="field__label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="field__input"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              data-testid="email-input"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="field__input"
              type="password"
              name="password"
              autoComplete={withConfirmation ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              data-testid="password-input"
            />
            {withConfirmation && (
              <p className="field__hint">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            )}
          </div>

          {withConfirmation && (
            <div className="field">
              <label className="field__label" htmlFor="confirmation">
                Confirm password
              </label>
              <input
                id="confirmation"
                className="field__input"
                type="password"
                name="confirmation"
                autoComplete="new-password"
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                data-testid="confirmation-input"
              />
            </div>
          )}

          {/* role="alert" so the message is announced when it appears,
              rather than sitting there silently for screen reader users. */}
          {error && (
            <p className="auth__error" role="alert" data-testid="auth-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn--primary auth__submit"
            disabled={pending}
            data-testid="auth-submit"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
        </form>

        <p className="auth__footer">
          {footer.prompt}{' '}
          <Link to={footer.to} className="auth__link">
            {footer.linkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}

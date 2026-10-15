import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from './AuthLayout';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email and we'll send you a reset link.">
      {sent ? (
        <div className="text-center space-y-4">
          <div className="p-4 rounded-full bg-success-500/10 w-fit mx-auto">
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
          <p className="text-muted">
            If an account exists for <span className="font-semibold text-[var(--color-text)]">{email}</span>,
            you'll receive a password reset email shortly.
          </p>
          <Link to="/login" className="btn-secondary inline-block px-6 py-2">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
      <p className="text-center text-sm text-muted mt-6">
        Remember your password?{' '}
        <Link to="/login" className="text-primary-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

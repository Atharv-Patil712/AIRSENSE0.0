import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from './AuthLayout';

export function LoginPage() {
  const { signIn, signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to access your environmental intelligence dashboard.">
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
        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-10"
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-[var(--color-border)]" />
            <span className="text-muted">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-primary-500 hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border)]" />
          </div>
          <span className="relative bg-[var(--color-surface)] px-2 text-[11px] font-mono uppercase text-muted">
            Instant Preview
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            signInAsGuest();
            navigate('/dashboard');
          }}
          className="w-full py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Preview EVS Dashboard as Guest</span>
        </button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary-500 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

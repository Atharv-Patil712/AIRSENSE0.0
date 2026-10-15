import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from './AuthLayout';

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <AuthLayout title="Create Account" subtitle="Start monitoring India's environmental landscape today.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field pl-10"
              placeholder="Your name"
            />
          </div>
        </div>
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
              placeholder="At least 6 characters"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field pl-10"
              placeholder="••••••••"
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 disabled:opacity-50">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input, Button } from '../components/ui';
import logoUrl from '../logo.svg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signIn, user, loading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  useEffect(() => {
    if (!loading && user) navigate(redirectTo, { replace: true });
  }, [user, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-50">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await signIn(email, password);
    if (err) {
      setError(err);
      setSubmitting(false);
    } else {
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="scroll-area">
        <div className="min-h-full flex flex-col justify-center px-5 pt-safe pb-safe">
          <div className="w-full max-w-sm mx-auto py-10 flex flex-col gap-8">

            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-sm">
                <img src={logoUrl} alt="fridgy" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-5">
              <h2 className="text-h3 font-heading text-neutral-900">Welcome back</h2>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  inputSize="lg"
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  inputSize="lg"
                />

                {error && (
                  <p className="text-body-sm text-red-700 bg-red-50 rounded-md px-3 py-2 font-sans">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
                  Sign In
                </Button>
              </form>

              <p className="text-center text-body-sm text-neutral-500 font-sans">
                No account?{' '}
                <Link to="/register" className="text-green-600 font-semibold active:opacity-70">
                  Create one
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

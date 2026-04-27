import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Input, Button } from '../components/ui';

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
      // signIn() set loading:true in the store — navigate now and let
      // ProtectedRoute show a spinner until onAuthStateChange delivers the session.
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="scroll-area">
        <div className="min-h-full flex flex-col justify-center px-6 pt-safe pb-safe">
          <div className="w-full max-w-sm mx-auto py-12">

            {/* Logo */}
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold text-green-500 tracking-tight font-sans">fridgy</h1>
              <p className="text-neutral-400 text-sm mt-2 font-sans">Shopping List · Pantry · Recipes</p>
            </div>

            {/* Form */}
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
                <p className="text-sm text-danger-600 text-center bg-danger-50 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="xl"
                fullWidth
                loading={submitting}
                className="mt-2"
              >
                Sign In
              </Button>
            </form>

            <p className="text-center text-sm text-neutral-500 mt-6 font-sans">
              Don't have an account?{' '}
              <Link to="/register" className="text-green-500 font-semibold active:opacity-70">
                Create one
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

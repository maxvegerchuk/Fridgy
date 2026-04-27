import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf } from 'phosphor-react';
import { useAuthStore } from '../store/authStore';
import { Input, Button, useToast } from '../components/ui';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { signUp, user, loading } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

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
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    const err = await signUp(email, password, displayName);
    if (err) {
      setError(err);
      setSubmitting(false);
    } else {
      toast('Account created! Check your email to confirm.', 'info');
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="scroll-area">
        <div className="min-h-full flex flex-col justify-center px-6 pt-safe pb-safe">
          <div className="w-full max-w-sm mx-auto py-12">

            {/* Logo */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center shadow-sm">
                  <Leaf size={26} weight="fill" className="text-green-500" />
                </div>
              </div>
              <h1 className="text-6xl font-bold italic font-display text-green-600 leading-none tracking-tight">fridgy</h1>
              <p className="text-neutral-400 text-xs mt-3 font-sans tracking-[0.12em] uppercase">Shopping · Pantry · Recipes</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Your name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Smith"
                autoComplete="name"
                required
                inputSize="lg"
              />
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
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
                inputSize="lg"
              />
              <Input
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
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
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-neutral-500 mt-6 font-sans">
              Already have an account?{' '}
              <Link to="/login" className="text-green-500 font-semibold active:opacity-70">
                Sign in
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

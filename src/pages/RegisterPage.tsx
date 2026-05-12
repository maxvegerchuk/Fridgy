import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
        <div className="min-h-full flex flex-col justify-center px-5 pt-safe pb-safe">
          <div className="w-full max-w-sm mx-auto py-10 flex flex-col gap-8">

            {/* Brand */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center shadow-sm">
                <span className="text-[32px] font-bold italic text-white leading-none font-heading">f</span>
              </div>
              <div className="text-center">
                <h1 className="text-h1 font-bold text-neutral-900 tracking-tight font-heading">fridgy</h1>
                <p className="text-body-sm text-neutral-400 mt-1 font-sans">Your kitchen, organised</p>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-5 py-6 flex flex-col gap-5">
              <h2 className="text-h3 font-heading text-neutral-900">Create account</h2>

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
                  <p className="text-body-sm text-red-700 bg-red-50 rounded-md px-3 py-2 font-sans">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" fullWidth loading={submitting} className="mt-1">
                  Create Account
                </Button>
              </form>

              <p className="text-center text-body-sm text-neutral-500 font-sans">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 font-semibold active:opacity-70">
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

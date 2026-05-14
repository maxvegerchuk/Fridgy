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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!displayName || !email || !password || !confirmPassword) {
      setError('This field is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
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
    <div className="fixed inset-0 flex flex-col overflow-hidden">

      {/* Top section — 32vh */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ height: '32vh' }}
      >
        <img
          src="/singup-bg.png"
          alt=""
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />
      </div>

      {/* Bottom white card */}
      <div
        className="relative z-10 flex flex-col flex-1 bg-white overflow-y-auto"
        style={{ marginTop: '-20px', borderRadius: '20px 20px 0 0', padding: '32px 24px 40px' }}
      >
        <h1 className="font-heading text-[28px] font-extrabold text-neutral-900 mb-6">
          Sign Up
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="mb-4">
            <label className="block font-sans text-[15px] font-medium text-neutral-600 mb-1.5">
              Your name
            </label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Smith"
              autoComplete="name"
              inputSize="lg"
            />
          </div>

          <div className="mb-4">
            <label className="block font-sans text-[15px] font-medium text-neutral-600 mb-1.5">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.com"
              autoComplete="email"
              inputSize="lg"
            />
          </div>

          <div className="mb-4">
            <label className="block font-sans text-[15px] font-medium text-neutral-600 mb-1.5">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              inputSize="lg"
            />
          </div>

          <div className="mb-6">
            <label className="block font-sans text-[15px] font-medium text-neutral-600 mb-1.5">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              inputSize="lg"
            />
            {error && (
              <p className="font-sans text-[14px] mt-2 text-red-500">
                {error}
              </p>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            className="!h-[54px] !font-bold mb-5"
          >
            Create Account
          </Button>
        </form>

        <p className="text-center font-sans text-[15px]">
          <span className="text-neutral-400">Already have an account? </span>
          <Link to="/login" className="text-green-500 font-bold active:opacity-70">
            Sign In
          </Link>
        </p>
      </div>

    </div>
  );
}

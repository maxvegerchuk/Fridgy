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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    <div className="fixed inset-0 flex flex-col overflow-hidden">

      {/* Top green section — 45vh */}
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ height: '45vh' }}
      >
        <img
          src="/login-background.png"
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
          }}
        />

        {/* fridgy logo text on top of SVG */}
        <div
          style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '48px',
            fontWeight: '800',
            color: 'white',
            whiteSpace: 'nowrap',
          }}>
            fridgy
          </span>
        </div>
      </div>

      {/* Bottom white card */}
      <div
        className="relative z-10 flex flex-col flex-1 bg-white overflow-y-auto"
        style={{ marginTop: '-20px', borderRadius: '20px 20px 0 0', padding: '32px 24px 40px' }}
      >
        <h1 className="font-heading text-[28px] font-extrabold text-neutral-900 mb-7">
          Welcome back
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Email */}
          <div className="mb-5">
            <label className="block font-sans text-[15px] font-medium text-neutral-600 mb-1.5">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              inputSize="lg"
            />
          </div>

          {/* Password */}
          <div className="mb-7">
            <label className="block font-sans text-[15px] font-medium text-neutral-600 mb-1.5">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              inputSize="lg"
            />
          </div>

          {error && (
            <p className="font-sans text-[15px] text-red-500 bg-red-50 rounded-md px-3 py-2 mb-5">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
            className="!h-[54px] !font-bold mb-5"
          >
            Sign In
          </Button>
        </form>

        <p className="text-center font-sans text-[15px]">
          <span className="text-neutral-400">No account? </span>
          <Link to="/register" className="text-green-500 font-bold active:opacity-70">
            Create One
          </Link>
        </p>
      </div>

    </div>
  );
}

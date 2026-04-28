import { useState } from 'react';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getHomeRouteForRole, normalizeRole } from '../utils/roleUtils';

const API = '/api';

function getFriendlyServerMessage(status, fallback) {
  if (status === 502 || status === 503 || status === 504) {
    return 'Backend server is not reachable. Start the Spring Boot app on http://localhost:8081 and try again.';
  }
  return fallback;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email.';
    if (!password) nextErrors.password = 'Password is required.';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setServerMsg('');

    try {
      const authResponse = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const rawText = await authResponse.text();
      let authData;
      try {
        authData = rawText ? JSON.parse(rawText) : {};
      } catch {
        authData = { success: false, message: rawText || `Unexpected response (${authResponse.status})` };
      }

      if (authResponse.status === 403) {
        navigate('/verify-otp', { state: { email } });
        return;
      }

      if (authResponse.ok && authData.success) {
        const userRole = normalizeRole(authData.role);

        if (userRole === 'DRIVER') {
          const driverResponse = await fetch(`${API}/drivers/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!driverResponse.ok) {
            const driverText = await driverResponse.text();
            let driverData;
            try {
              driverData = driverText ? JSON.parse(driverText) : {};
            } catch {
              driverData = { message: driverText || '' };
            }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('driver');
            setServerMsg(driverData.message || 'Driver account is not ready for dashboard access.');
            return;
          }

          const driverData = await driverResponse.json();
          if (authData.token) localStorage.setItem('token', authData.token);
          localStorage.removeItem('user');
          localStorage.setItem('driver', JSON.stringify(driverData));
          navigate('/driver/dashboard', { replace: true });
          return;
        }

        if (authData.token) localStorage.setItem('token', authData.token);
        localStorage.removeItem('driver');
        localStorage.setItem('user', JSON.stringify({
          id: authData.userId,
          name: authData.name,
          email: authData.email,
          role: authData.role,
        }));
        navigate(getHomeRouteForRole(userRole), { replace: true });
        return;
      }

      const driverResponse = await fetch(`${API}/drivers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (driverResponse.ok) {
        const driverData = await driverResponse.json();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.setItem('driver', JSON.stringify(driverData));
        navigate('/driver/dashboard', { replace: true });
        return;
      }

      const driverText = await driverResponse.text();
      let driverData;
      try {
        driverData = driverText ? JSON.parse(driverText) : {};
      } catch {
        driverData = { message: driverText || '' };
      }

      const debug = authData.debugMessage ? ` (${authData.debugMessage})` : '';
      setServerMsg(
        driverData.message && driverData.message !== 'Invalid credentials'
          ? driverData.message
          : getFriendlyServerMessage(authResponse.status, (authData.message || 'Invalid credentials.') + debug)
      );
    } catch (error) {
      setServerMsg(error.message || 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-warm">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex items-start justify-center px-6 py-8 lg:order-1 lg:py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-lg font-black text-white">F</div>
              <div>
                <p className="text-xl font-black text-ink-900">Foodyy</p>
                <p className="text-xs uppercase tracking-[0.22em] text-ink-400">Premium delivery</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-brand-100 bg-white p-8 shadow-float">
              <div className="mb-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                  Welcome back
                </div>
                <h2 className="mt-4 text-3xl font-black text-ink-900">Login for all users</h2>
                <p className="mt-2 text-sm text-ink-500">Enter your credentials and Foodyy will route you to the correct dashboard.</p>
              </div>

              {serverMsg && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {serverMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-ink-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrors((current) => ({ ...current, email: '' }));
                      setServerMsg('');
                    }}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink-800 focus:outline-none focus:ring-2 transition ${
                      errors.email ? 'border-red-400 focus:ring-red-200' : 'border-brand-200 focus:border-brand-400 focus:ring-brand-200'
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-ink-700">Password</label>
                    <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:underline">Forgot password?</Link>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setErrors((current) => ({ ...current, password: '' }));
                      setServerMsg('');
                    }}
                    className={`w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink-800 focus:outline-none focus:ring-2 transition ${
                      errors.password ? 'border-red-400 focus:ring-red-200' : 'border-brand-200 focus:border-brand-400 focus:ring-brand-200'
                    }`}
                  />
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>

                <div className="flex items-center gap-2">
                  <input id="showPass" type="checkbox" checked={showPass} onChange={(event) => setShowPass(event.target.checked)} className="h-4 w-4 cursor-pointer accent-brand-500" />
                  <label htmlFor="showPass" className="cursor-pointer text-sm text-ink-500">Show password</label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 w-full rounded-2xl bg-brand-500 py-3.5 text-base font-bold text-white shadow-glow transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="mt-7 space-y-3 text-center">
                <p className="text-sm text-ink-500">
                  New customer?{' '}
                  <Link to="/customer-signup" className="font-bold text-brand-600 hover:underline">Create account</Link>
                </p>
                <p className="text-sm text-ink-500">
                  New restaurant partner?{' '}
                  <Link to="/restaurant-signup" className="font-bold text-brand-600 hover:underline">Register restaurant</Link>
                  <ChevronRight size={14} className="ml-1 inline" />
                </p>
                <p className="text-sm text-ink-500">
                  New driver?{' '}
                  <Link to="/driver/signup" className="font-bold text-brand-600 hover:underline">Register driver</Link>
                  <ChevronRight size={14} className="ml-1 inline" />
                </p>
                <p className="text-sm text-ink-500">
                  Login with OTP?{' '}
                  <Link to="/email-otp-login" className="font-bold text-brand-600 hover:underline">Email OTP login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#FF6A2B_0%,#FF8D5D_55%,#FFD5C4_100%)] lg:order-2 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,248,240,0.24),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,204,188,0.28),transparent_30%)]" />

          <div className="relative z-10">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-brand-100 backdrop-blur">
              <ShieldCheck size={16} />
              Unified access for all account types
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-xl font-black text-white shadow-glow">F</div>
              <div>
                <p className="text-3xl font-black text-white">Foodyy</p>
                <p className="text-sm uppercase tracking-[0.32em] text-brand-100">Premium delivery</p>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-100">Single login experience</p>
            <h1 className="mt-5 text-5xl font-black leading-tight text-white">One login. Every food workflow, instantly within reach.</h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-brand-100">
              Customers order, restaurants prepare, drivers deliver, and admins monitor everything from the same polished Foodyy platform.
            </p>

            <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-[0_24px_70px_rgba(122,32,0,0.22)] backdrop-blur">
              <img
                src="https://images.pexels.com/photos/8931682/pexels-photo-8931682.jpeg?cs=srgb&dl=pexels-kampus-8931682.jpg&fm=jpg"
                alt="Professional delivery courier carrying an insulated food bag"
                className="h-[25rem] w-full object-cover object-center"
              />
              <div className="border-t border-white/15 bg-slate-950/25 px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-100">Delivery-first experience</p>
                    <p className="mt-2 text-sm leading-7 text-white/90">Realistic courier visuals, warm brand tones, and a premium onboarding flow that matches the rest of the app.</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-100">Live ops</p>
                    <p className="mt-1 text-lg font-black text-white">Food delivery</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 rounded-[2rem] border border-white/20 bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-brand-100">Fast login, warmer palette, and smoother order flow aligned with your reference screens.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

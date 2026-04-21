import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHomeRouteForRole, normalizeRole } from '../utils/roleUtils';

const API = 'http://localhost:8081/api';

const ROLES = [
  { value: 'CUSTOMER',   label: '🛒 Customer',        hint: 'Order food from restaurants' },
  { value: 'RESTAURANT', label: '🍽️ Restaurant Owner', hint: 'Manage your restaurant' },
  { value: 'ADMIN',      label: '⚙️ Admin',            hint: 'Platform administration' },
];

const VISUALS = {
  CUSTOMER: {
    gradient: 'from-orange-500 via-red-500 to-rose-600',
    bg: ['🍕', '🍔', '🥟', '🍜'],
    title: 'Order food,\nanytime anywhere',
    desc: 'Discover restaurants near you and get fresh food delivered fast.',
  },
  RESTAURANT: {
    gradient: 'from-gray-900 via-gray-800 to-gray-900',
    bg: ['🍳', '🥗', '🍱', '👨‍🍳'],
    title: 'Grow your\nrestaurant business',
    desc: 'Access your dashboard, manage orders, and track revenue in real time.',
  },
  ADMIN: {
    gradient: 'from-indigo-700 via-purple-700 to-indigo-900',
    bg: ['📊', '🛡️', '🔧', '📋'],
    title: 'Platform\nadministration',
    desc: 'Oversee restaurants, customers, and orders from the control panel.',
  },
};

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole]           = useState('CUSTOMER');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [errors, setErrors]       = useState({});
  const [serverMsg, setServerMsg] = useState('');
  const [serverOk, setServerOk]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const visual = VISUALS[role] || VISUALS.CUSTOMER;

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email.';
    if (!password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerMsg('');
    setServerOk(false);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        data = { success: false, message: rawText || `Unexpected response (${res.status})` };
      }

      if (!res.ok) {
        const debug = data.debugMessage ? ` (${data.debugMessage})` : '';
        if (res.status === 403) {
          navigate('/verify-otp', { state: { email } });
          return;
        }
        setServerOk(false);
        setServerMsg(data.message || `Server error (${res.status})` + debug);
        return;
      }

      if (data.success) {
        const userRole = normalizeRole(data.role);
        if (role !== 'ADMIN' && userRole !== role) {
          setServerOk(false);
          setServerMsg(`This account is registered as ${userRole.toLowerCase()}. Please select the correct role.`);
          return;
        }

        if (data.token) localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          id: data.userId, name: data.name, email: data.email, role: data.role,
        }));
        navigate(getHomeRouteForRole(userRole), { replace: true });
      } else {
        setServerOk(false);
        const debug = data.debugMessage ? ` (${data.debugMessage})` : '';
        if (res.status === 403) {
          navigate('/verify-otp', { state: { email } });
          return;
        }
        setServerMsg((data.message || 'Invalid credentials.') + debug);
      }
    } catch (err) {
      setServerOk(false);
      setServerMsg(err.message || 'Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Visual Panel ── */}
      <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br ${visual.gradient} relative overflow-hidden flex-col justify-between p-12 transition-all duration-500`}>
        {/* Background emojis */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {visual.bg.map((em, i) => (
            <div
              key={i}
              className="absolute opacity-10 select-none"
              style={{
                fontSize: `${100 + i * 20}px`,
                top: `${[10, 55, 5, 65][i]}%`,
                left: `${[5, 60, 55, 10][i]}%`,
              }}
            >{em}</div>
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-orange-500 text-xl">F</div>
            <span className="text-white font-black text-2xl">Foodyy</span>
          </div>
        </div>

        {/* Real food image */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="rounded-3xl overflow-hidden shadow-2xl mb-6" style={{height: '260px'}}>
            <img
              src={
                role === 'RESTAURANT'
                  ? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80'
                  : role === 'ADMIN'
                  ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80'
                  : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80'
              }
              alt="food"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-3xl font-black text-white leading-tight mb-3 whitespace-pre-line">{visual.title}</h2>
          <p className="text-white/70 text-base leading-relaxed">{visual.desc}</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur rounded-2xl p-4">
          <p className="text-white/80 text-sm">
            🔒 Your data is encrypted and protected with industry-standard security.
          </p>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center font-black text-white">F</div>
            <span className="font-black text-xl text-gray-800">Foodyy</span>
          </div>

          <div className="mb-7">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Welcome back! 👋</h1>
            <p className="text-gray-500 text-sm">Sign in to continue</p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-2">Login as</p>
            <div className="grid grid-cols-3 gap-2 bg-white border border-gray-200 rounded-2xl p-1.5">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => { setRole(r.value); setServerMsg(''); }}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    role === r.value
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base">{r.label.split(' ')[0]}</span>
                  <span className="leading-tight text-center">{r.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-center">
              {ROLES.find(r => r.value === role)?.hint}
            </p>
          </div>

          {serverMsg && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
              serverOk
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {serverMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors({ ...errors, email: '' }); setServerMsg(''); }}
                className={`w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition ${
                  errors.email ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-orange-200 focus:border-orange-400'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-xs text-orange-500 hover:underline font-medium">Forgot password?</Link>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setErrors({ ...errors, password: '' }); setServerMsg(''); }}
                className={`w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 transition ${
                  errors.password ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-orange-200 focus:border-orange-400'
                }`}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input id="showPass" type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} className="w-4 h-4 accent-orange-500 cursor-pointer" />
              <label htmlFor="showPass" className="text-sm text-gray-500 cursor-pointer">Show password</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : `Sign In as ${ROLES.find(r => r.value === role)?.label.split(' ').slice(1).join(' ') || role}`}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              New customer?{' '}
              <Link to="/customer-signup" className="text-orange-500 font-bold hover:underline">Create account</Link>
            </p>
            <p className="text-sm text-gray-500">
              New restaurant partner?{' '}
              <Link to="/restaurant-signup" className="text-orange-500 font-bold hover:underline">Register restaurant →</Link>
            </p>
            <p className="text-sm text-gray-500">
              Login with OTP?{' '}
              <Link to="/email-otp-login" className="text-orange-500 font-bold hover:underline">Email OTP login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


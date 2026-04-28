import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api/authApi';

const API = 'http://localhost:8081/api';

function Field({ id, label, type = 'text', placeholder, value, error, onChange, showPass }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={id === 'password' || id === 'confirm' ? (showPass ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition ${
            error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-brand-200 focus:border-brand-400'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export default function CustomerSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState('');
  const [serverOk, setServerOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password))
      e.password = 'Min 8 chars with at least 1 letter and 1 number.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: '' });
    setServerMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerMsg('');
    try {
      const res = await fetch(`${API}/auth/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        setServerOk(true);
        setServerMsg('Account created! Check your email for the verification OTP.');
        setTimeout(() => navigate('/verify-otp', { state: { email: form.email } }), 2000);
      } else {
        setServerOk(false);
        setServerMsg(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setServerOk(false);
      setServerMsg('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between">

        {/* Full-bleed food photograph */}
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=85&fit=crop"
          alt="Gourmet food"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Layered gradient overlay — dark at top & bottom, semi-transparent in middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/75" />

        {/* Subtle orange tint stripe */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/35 via-transparent to-transparent" />

        {/* ── Top: Logo ── */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-brand-500/40">
              F
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Foodyy</span>
            <span className="ml-1 px-2.5 py-0.5 rounded-full bg-brand-500/25 text-accent-200 text-[11px] font-bold border border-brand-400/30 uppercase tracking-wider">
              Customer
            </span>
          </div>
        </div>

        {/* ── Middle: Hero copy ── */}
        <div className="relative z-10 px-10">
          <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-3">
            ✦ &nbsp;Welcome to Foodyy
          </p>
          <h2 className="text-[2.6rem] font-black text-white leading-[1.15] mb-5">
            Great food,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-accent-200">
              delivered fast.
            </span>
          </h2>
          <p className="text-white/65 text-base leading-relaxed max-w-xs">
            Order from hundreds of top-rated restaurants around you. Fresh, hot, and at your door in minutes.
          </p>
        </div>

        {/* ── Bottom: Trust bar ── */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-6 border-t border-white/10 pt-7">
            <div className="text-center">
              <p className="text-white font-black text-2xl leading-none">50K+</p>
              <p className="text-white/50 text-xs mt-1">Happy Customers</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div className="text-center">
              <p className="text-white font-black text-2xl leading-none">200+</p>
              <p className="text-white/50 text-xs mt-1">Restaurants</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div className="text-center">
              <p className="text-white font-black text-2xl leading-none">4.9★</p>
              <p className="text-white/50 text-xs mt-1">Avg. Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center font-black text-white">F</div>
            <span className="font-black text-xl text-gray-800">Foodyy</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-500">Start ordering delicious food today 🎉</p>
          </div>

          {serverMsg && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
              serverOk
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {serverOk ? '✅ ' : '⚠️ '}{serverMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field id="name"     label="Full Name"        placeholder="John Doe"           value={form.name}     error={errors.name}     onChange={handleChange} showPass={showPass} />
            <Field id="email"    label="Email Address"    type="email" placeholder="you@example.com" value={form.email}    error={errors.email}    onChange={handleChange} showPass={showPass} />
            <Field id="password" label="Password"         placeholder="Min 8 chars"        value={form.password} error={errors.password} onChange={handleChange} showPass={showPass} />
            <Field id="confirm"  label="Confirm Password" placeholder="Repeat password"    value={form.confirm}  error={errors.confirm}  onChange={handleChange} showPass={showPass} />

            <div className="flex items-center gap-2 mt-1">
              <input
                id="showPass"
                type="checkbox"
                checked={showPass}
                onChange={e => setShowPass(e.target.checked)}
                className="w-4 h-4 accent-brand-500 cursor-pointer"
              />
              <label htmlFor="showPass" className="text-sm text-gray-500 cursor-pointer">Show passwords</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-200 disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account 🎉'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 font-bold hover:underline">Sign in</Link>
            </p>
            <p className="text-sm text-gray-500">
              Own a restaurant?{' '}
              <Link to="/restaurant-signup" className="text-brand-500 font-bold hover:underline">Register your restaurant →</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            By signing up, you agree to our{' '}
            <span className="underline cursor-pointer">Terms of Service</span> and{' '}
            <span className="underline cursor-pointer">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

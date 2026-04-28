import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8081/api';
const DRIVER_HIGHLIGHTS = [
  {
    label: 'Fast pickups',
    copy: 'Restaurant-ready orders with a clean handoff flow.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80',
  },
  {
    label: 'Reliable routes',
    copy: 'Stay aligned with active deliveries and customer timing.',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=700&q=80',
  },
  {
    label: 'Premium meals',
    copy: 'Represent a polished food brand on every trip you complete.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
  },
];

function Field({ id, label, type = 'text', placeholder, value, error, onChange, showPass }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
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
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export default function DriverSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '', vehicleDetails: '' });
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
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number.';
    if (!form.password) e.password = 'Password is required.';
    else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) e.password = 'Min 8 chars with at least 1 letter and 1 number.';
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
      const res = await fetch(`${API}/drivers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email, password: form.password, vehicleDetails: form.vehicleDetails }),
      });
      if (res.ok) {
        setServerOk(true);
        setServerMsg('Registration submitted! Verify your email — pending admin approval.');
        setTimeout(() => navigate('/verify-otp', { state: { email: form.email } }), 2000);
      } else {
        const txt = await res.text();
        let data = {};
        try { data = txt ? JSON.parse(txt) : {}; } catch { data = { message: txt }; }
        console.warn('Driver register failed', res.status, data);
        setServerOk(false);
        const debug = data.debugMessage ? ` — ${data.debugMessage}` : '';
        setServerMsg((data.message || `Registration failed (${res.status})`) + debug);
      }
    } catch (err) {
      setServerOk(false);
      setServerMsg('Server error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
          alt="Fresh plated food"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/35 to-slate-950/85" />
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/45 via-transparent to-transparent" />

        <div className="relative z-10 p-10">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-lg font-black text-white shadow-glow">F</div>
            Foodyy driver network
          </div>
        </div>

        <div className="relative z-10 px-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-200">Deliver the best of your city</p>
          <h2 className="mt-4 max-w-lg text-[2.9rem] font-black leading-[1.08] text-white">Join a delivery fleet built around premium food experiences.</h2>
          <p className="mt-5 max-w-md text-base leading-8 text-white/75">
            Pick up standout meals, complete smooth handoffs, and keep every order moving with confidence.
          </p>
        </div>

        <div className="relative z-10 p-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {DRIVER_HIGHLIGHTS.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <img src={item.image} alt={item.label} className="h-24 w-full rounded-[1rem] object-cover" />
                <p className="mt-3 text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/65">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Driver Sign Up</h1>
            <p className="text-gray-500 text-sm">Create your driver account — email verification and admin approval required.</p>
          </div>

          {serverMsg && (
            <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium border ${
              serverOk ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {serverOk ? '✅ ' : '⚠️ '}{serverMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="name" label="Full Name" placeholder="John Doe" value={form.name} error={errors.name} onChange={handleChange} showPass={showPass} />
              <Field id="phone" label="Phone Number" type="tel" placeholder="e.g. +1 555 555 5555" value={form.phone} error={errors.phone} onChange={handleChange} showPass={showPass} />
            </div>

            <Field id="email" label="Email Address" type="email" placeholder="driver@example.com" value={form.email} error={errors.email} onChange={handleChange} showPass={showPass} />

            <Field id="vehicleDetails" label="Vehicle Details" placeholder="e.g. Bike - Yamaha FZ" value={form.vehicleDetails} error={errors.vehicleDetails} onChange={handleChange} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="password" label="Password" placeholder="Min 8 chars" value={form.password} error={errors.password} onChange={handleChange} showPass={showPass} />
              <Field id="confirm" label="Confirm Password" placeholder="Repeat password" value={form.confirm} error={errors.confirm} onChange={handleChange} showPass={showPass} />
            </div>

            <div className="flex items-center gap-2">
              <input id="showPass" type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} className="w-4 h-4 accent-brand-500 cursor-pointer" />
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
                  Registering…
                </span>
              ) : 'Create Driver Account'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <a href="/driver/login" className="text-brand-500 font-bold hover:underline">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

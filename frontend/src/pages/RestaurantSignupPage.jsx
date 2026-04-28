import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API = 'http://localhost:8081/api';

function Field({ id, label, type = 'text', placeholder, error, textarea = false, value, onChange, showPass }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-gray-700">{label}</label>
      {textarea ? (
        <textarea
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          rows={2}
          className={`w-full px-4 py-3 rounded-xl border text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 resize-none transition ${
            error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-brand-200 focus:border-brand-400'
          }`}
        />
      ) : (
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
      )}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

export default function RestaurantSignupPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    restaurantName: '', ownerName: '', email: '', phone: '', address: '', password: '', confirm: '',
  });
  const [errors, setErrors]       = useState({});
  const [serverMsg, setServerMsg] = useState('');
  const [serverOk, setServerOk]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.restaurantName.trim()) e.restaurantName = 'Restaurant name is required.';
    if (!form.ownerName.trim())      e.ownerName = 'Owner name is required.';
    if (!form.email.trim())          e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim())          e.phone = 'Phone number is required.';
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number.';
    if (!form.address.trim())        e.address = 'Address is required.';
    if (!form.password)              e.password = 'Password is required.';
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const res = await fetch(`${API}/upload/image`, { method: 'POST', body: fd });
      const data = await res.json();
      return data.url || data.imageUrl || null;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setServerMsg('');
    try {
      const imageUrl = await uploadImage();
      const res = await fetch(`${API}/auth/restaurant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: form.restaurantName,
          ownerName: form.ownerName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          password: form.password,
          imageUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServerOk(true);
        setServerMsg('Restaurant registered! Verify your email — pending admin approval.');
        setTimeout(() => navigate('/verify-otp', { state: { email: form.email } }), 2500);
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
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between">

        {/* Full-bleed restaurant/kitchen photograph */}
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=85&fit=crop"
          alt="Fine dining restaurant"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Multi-layer gradient — dark top & bottom, window in middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/25 to-black/80" />
        {/* Warm amber tint from bottom-left for brand identity */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-900/40 via-transparent to-transparent" />

        {/* ── Top: Logo ── */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg shadow-brand-500/40">
              F
            </div>
            <span className="text-white font-black text-2xl tracking-tight">Foodyy</span>
            <span className="ml-1 px-2.5 py-0.5 rounded-full bg-brand-500/25 text-accent-200 text-[11px] font-bold border border-brand-400/30 uppercase tracking-wider">
              Partner
            </span>
          </div>
        </div>

        {/* ── Middle: Hero copy ── */}
        <div className="relative z-10 px-10">
          <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-3">
            ✦ &nbsp;Grow with us
          </p>
          <h2 className="text-[2.6rem] font-black text-white leading-[1.15] mb-5">
            List your restaurant,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-200 to-brand-300">
              reach thousands.
            </span>
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            Join Foodyy's growing network of partner restaurants. Get orders, manage your menu, and track revenue — all in one place.
          </p>
        </div>

        {/* ── Bottom: Stats + process note ── */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-6 border-t border-white/10 pt-7 mb-6">
            <div className="text-center">
              <p className="text-white font-black text-2xl leading-none">200+</p>
              <p className="text-white/50 text-xs mt-1">Partner Restaurants</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div className="text-center">
              <p className="text-white font-black text-2xl leading-none">50K+</p>
              <p className="text-white/50 text-xs mt-1">Active Customers</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div className="text-center">
              <p className="text-white font-black text-2xl leading-none">~24h</p>
              <p className="text-white/50 text-xs mt-1">Approval Time</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-200 mt-1.5 flex-shrink-0" />
            <p className="text-white/55 text-xs leading-relaxed">
              After sign-up, verify your email. Our team reviews and approves your restaurant within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="flex-1 flex items-start justify-center px-6 py-10 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center font-black text-white">F</div>
            <span className="font-black text-xl text-gray-800">Foodyy</span>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Register Your Restaurant</h1>
            <p className="text-gray-500 text-sm">Fill in your details — admin approval required after email verification.</p>
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

            {/* Restaurant Image Upload */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Restaurant Photo <span className="text-gray-400 font-normal">(optional)</span></label>
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 hover:border-brand-400 bg-gray-50 hover:bg-brand-50 transition cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-sm font-bold bg-black/50 px-3 py-1 rounded-full">Change Photo</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl">📷</div>
                    <p className="text-sm text-gray-500 font-medium">Click to upload restaurant photo</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="restaurantName" label="Restaurant Name"  placeholder="e.g. Spice Garden"      error={errors.restaurantName} value={form.restaurantName} onChange={handleChange} showPass={showPass} />
              <Field id="ownerName"      label="Owner Name"        placeholder="e.g. Rahul Sharma"      error={errors.ownerName} value={form.ownerName} onChange={handleChange} showPass={showPass} />
            </div>

            <Field id="email"   label="Email Address" type="email" placeholder="restaurant@example.com" error={errors.email} value={form.email} onChange={handleChange} showPass={showPass} />
            <Field id="phone"   label="Phone Number"  type="tel"   placeholder="+91 98765 43210"         error={errors.phone} value={form.phone} onChange={handleChange} showPass={showPass} />
            <Field id="address" label="Restaurant Address" placeholder="Full address including city and pincode" error={errors.address} textarea value={form.address} onChange={handleChange} showPass={showPass} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="password" label="Password"         placeholder="Min 8 chars"   error={errors.password} value={form.password} onChange={handleChange} showPass={showPass} />
              <Field id="confirm"  label="Confirm Password" placeholder="Repeat password" error={errors.confirm} value={form.confirm} onChange={handleChange} showPass={showPass} />
            </div>

            <div className="flex items-center gap-2">
              <input id="showPass" type="checkbox" checked={showPass} onChange={e => setShowPass(e.target.checked)} className="w-4 h-4 accent-brand-500 cursor-pointer" />
              <label htmlFor="showPass" className="text-sm text-gray-500 cursor-pointer">Show passwords</label>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="mt-1 w-full bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-200 disabled:opacity-60 disabled:cursor-not-allowed text-base"
            >
              {loading || uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {uploading ? 'Uploading image…' : 'Registering…'}
                </span>
              ) : 'Register Restaurant 🍽️'}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-500 font-bold hover:underline">Sign in</Link>
            </p>
            <p className="text-sm text-gray-500">
              Customer?{' '}
              <Link to="/customer-signup" className="text-brand-500 font-bold hover:underline">Sign up here →</Link>
            </p>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            By registering, you agree to our Partner Terms & Conditions.
          </p>
        </div>
      </div>
    </div>
  );
}

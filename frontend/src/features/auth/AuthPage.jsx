import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';
import { registerUser, verifyOtp, loginUser } from '../../api/authApi';
import { isValidEmail, isValidPhone, isValidPassword } from '../../utils/validation';
import { getHomeRouteForRole, normalizeRole } from '../../utils/roleUtils';

const VIEWS = { REGISTRATION: 'REGISTRATION', OTP: 'OTP', LOGIN: 'LOGIN', FORGOT: 'FORGOT' };

// ─── Reusable field ───────────────────────────────────────────────────────────
function Field({ label, id, type = 'text', icon: Icon, value, onChange, error, placeholder, rightSlot }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Icon size={16} />
          </div>
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-9' : 'pl-4'} ${rightSlot ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border text-sm
            focus:outline-none focus:ring-2 transition
            ${error ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-orange-200 bg-white'}`}
        />
        {rightSlot && (
          <div className="absolute inset-y-0 right-3 flex items-center">{rightSlot}</div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── OTP boxes ────────────────────────────────────────────────────────────────
function OtpBoxes({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (e, i) => {
    const ch = e.target.value.replace(/\D/, '');
    const next = [...digits];
    next[i] = ch;
    onChange(next.join(''));
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 focus:outline-none transition
            ${d ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 bg-white text-gray-800'}
            focus:border-orange-400`}
        />
      ))}
    </div>
  );
}

// ─── Main AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage({ onAuthSuccess }) {
  const [view, setView] = useState(VIEWS.LOGIN);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Registration state
  const [reg, setReg] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
  const [regErrors, setRegErrors] = useState({});
  const [showRegPwd, setShowRegPwd] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Login state
  const [login, setLogin] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Resend OTP countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const clearErrors = () => {
    setServerError('');
    setRegErrors({});
    setLoginErrors({});
    setOtpError('');
    setForgotError('');
  };

  const switchView = (next) => { clearErrors(); setView(next); };

  // ── Registration submit ──
  const handleRegister = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!reg.name.trim() || reg.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!isValidEmail(reg.email)) errors.email = 'Enter a valid email address';
    if (!isValidPhone(reg.phone)) errors.phone = 'Enter a valid 10-digit mobile number';
    if (!isValidPassword(reg.password)) errors.password = 'Min 8 characters, at least 1 letter and 1 number';
    if (Object.keys(errors).length) { setRegErrors(errors); return; }

    setLoading(true);
    setServerError('');
    try {
      await registerUser(reg);
      setResendCooldown(30);
      switchView(VIEWS.OTP);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP submit ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.replace(/\D/g, '').length < 6) { setOtpError('Enter all 6 digits'); return; }
    setLoading(true);
    setOtpError('');
    try {
      await verifyOtp(reg.email, otp);
      setOtp('');
      switchView(VIEWS.LOGIN);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid or expired OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await registerUser(reg); // triggers OTP resend via backend
      setResendCooldown(30);
      setOtpError('');
    } catch {
      setOtpError('Failed to resend OTP. Please try again.');
    }
  };

  // ── Login submit ──
  const handleLogin = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!isValidEmail(login.email)) errors.email = 'Enter a valid email address';
    if (!login.password || login.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (Object.keys(errors).length) { setLoginErrors(errors); return; }

    setLoading(true);
    setServerError('');
    try {
      const { data } = await loginUser(login);
      if (data?.token) {
        localStorage.setItem('token', data.token);
        const userPayload = data.user || {
          id: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
        };
        localStorage.setItem('user', JSON.stringify(userPayload));
        const redirectPath = getHomeRouteForRole(userPayload.role);
        window.location.href = redirectPath;
        return;
      }
      onAuthSuccess?.(data);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password submit ──
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!isValidEmail(forgotEmail)) { setForgotError('Enter a valid email address'); return; }
    setLoading(true);
    try {
      // Simulated call — replace with real endpoint when available
      await new Promise((r) => setTimeout(r, 800));
      setForgotSent(true);
    } catch {
      setForgotError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Shared submit button ──
  const SubmitBtn = ({ label }) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed
        text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-1"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Please wait...
        </>
      ) : (
        <>{label} <ChevronRight size={16} /></>
      )}
    </button>
  );

  // ═══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-lg mb-3">
            <span className="text-3xl">🍔</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Foodyy</h1>
          <p className="text-gray-500 text-sm">Fresh food, fast delivery by Foodyy</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">

          {/* View tabs (Login / Register) */}
          {(view === VIEWS.LOGIN || view === VIEWS.REGISTRATION) && (
            <div className="flex border-b border-gray-100">
              {[VIEWS.LOGIN, VIEWS.REGISTRATION].map((v) => (
                <button
                  key={v}
                  onClick={() => switchView(v)}
                  className={`flex-1 py-4 text-sm font-semibold transition
                    ${view === v
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {v === VIEWS.LOGIN ? 'Login' : 'Create Account'}
                </button>
              ))}
            </div>
          )}

          <div className="px-8 py-7">

            {/* ── SERVER ERROR BANNER ── */}
            {serverError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                <span className="mt-0.5">⚠️</span>
                <span>{serverError}</span>
              </div>
            )}

            {/* ══ REGISTRATION VIEW ══════════════════════════════════════════ */}
            {view === VIEWS.REGISTRATION && (
              <form onSubmit={handleRegister} noValidate className="flex flex-col gap-4">
                <Field
                  id="name" label="Full Name" icon={User}
                  placeholder="John Doe"
                  value={reg.name} error={regErrors.name}
                  onChange={(e) => setReg({ ...reg, name: e.target.value })}
                />
                <Field
                  id="email" label="Email Address" type="email" icon={Mail}
                  placeholder="you@example.com"
                  value={reg.email} error={regErrors.email}
                  onChange={(e) => setReg({ ...reg, email: e.target.value })}
                />
                <Field
                  id="phone" label="Phone Number" type="tel" icon={Phone}
                  placeholder="9876543210"
                  value={reg.phone} error={regErrors.phone}
                  onChange={(e) => setReg({ ...reg, phone: e.target.value })}
                />
                <Field
                  id="password" label="Password"
                  type={showRegPwd ? 'text' : 'password'} icon={Lock}
                  placeholder="Min 8 characters"
                  value={reg.password} error={regErrors.password}
                  onChange={(e) => setReg({ ...reg, password: e.target.value })}
                  rightSlot={
                    <button type="button" onClick={() => setShowRegPwd(!showRegPwd)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showRegPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <div className="flex flex-col gap-1">
                  <label htmlFor="role" className="text-sm font-medium text-gray-700">Account type</label>
                  <select
                    id="role"
                    value={reg.role}
                    onChange={(e) => setReg({ ...reg, role: e.target.value })}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    <option value="customer">Customer</option>
                    <option value="restaurant">Restaurant</option>
                  </select>
                </div>
                <SubmitBtn label="Create Account" />
                <p className="text-center text-xs text-gray-400">
                  By signing up you agree to our{' '}
                  <span className="text-orange-500 cursor-pointer hover:underline">Terms & Privacy Policy</span>
                </p>
              </form>
            )}

            {/* ══ OTP VERIFICATION VIEW ══════════════════════════════════════ */}
            {view === VIEWS.OTP && (
              <form onSubmit={handleVerifyOtp} noValidate className="flex flex-col gap-5">
                <button
                  type="button" onClick={() => switchView(VIEWS.REGISTRATION)}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 -mt-1 self-start"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <div className="text-center">
                  <div className="text-4xl mb-2">📬</div>
                  <h2 className="font-bold text-gray-800 text-lg">Check your inbox</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    We've sent a 6-digit code to{' '}
                    <span className="font-semibold text-orange-500">{reg.email}</span>
                  </p>
                </div>

                <OtpBoxes value={otp} onChange={setOtp} />
                {otpError && <p className="text-xs text-red-500 text-center">{otpError}</p>}

                <SubmitBtn label="Verify & Continue" />

                <div className="text-center text-sm">
                  {resendCooldown > 0 ? (
                    <span className="text-gray-400 flex items-center justify-center gap-1">
                      <RefreshCw size={12} /> Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button" onClick={handleResendOtp}
                      className="text-orange-500 hover:underline font-medium"
                    >
                      Didn't get it? Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ══ LOGIN VIEW ═════════════════════════════════════════════════ */}
            {view === VIEWS.LOGIN && (
              <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
                <Field
                  id="loginEmail" label="Email Address" type="email" icon={Mail}
                  placeholder="you@example.com"
                  value={login.email} error={loginErrors.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                />
                <Field
                  id="loginPassword" label="Password"
                  type={showLoginPwd ? 'text' : 'password'} icon={Lock}
                  placeholder="••••••••"
                  value={login.password} error={loginErrors.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                  rightSlot={
                    <button type="button" onClick={() => setShowLoginPwd(!showLoginPwd)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none">
                      {showLoginPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                <div className="flex justify-end -mt-2">
                  <button type="button" onClick={() => switchView(VIEWS.FORGOT)}
                    className="text-xs text-orange-500 hover:underline font-medium">
                    Forgot Password?
                  </button>
                </div>
                <SubmitBtn label="Login" />
              </form>
            )}

            {/* ══ FORGOT PASSWORD VIEW ═══════════════════════════════════════ */}
            {view === VIEWS.FORGOT && (
              <div className="flex flex-col gap-5">
                <button type="button" onClick={() => switchView(VIEWS.LOGIN)}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 -mt-1 self-start">
                  <ArrowLeft size={14} /> Back to Login
                </button>

                {forgotSent ? (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-3">✉️</div>
                    <h2 className="font-bold text-gray-800 text-lg">Reset link sent!</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Check <span className="font-semibold text-orange-500">{forgotEmail}</span> for the reset link.
                    </p>
                    <button onClick={() => { setForgotSent(false); switchView(VIEWS.LOGIN); }}
                      className="mt-5 text-sm text-orange-500 hover:underline font-medium">
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} noValidate className="flex flex-col gap-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🔑</div>
                      <h2 className="font-bold text-gray-800 text-lg">Reset your password</h2>
                      <p className="text-sm text-gray-500 mt-1">Enter your email and we'll send you a reset link.</p>
                    </div>
                    <Field
                      id="forgotEmail" label="Email Address" type="email" icon={Mail}
                      placeholder="you@example.com"
                      value={forgotEmail} error={forgotError}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                    />
                    <SubmitBtn label="Send Reset Link" />
                  </form>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-5">
          🔒 Your data is safe with us. We never share it.
        </p>
      </div>
    </div>
  );
}

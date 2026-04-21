import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { verifyOtp, resendOTP } from '../api/authApi';

export default function VerifyOtpPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Email can be passed via navigation state, query string, or stored fallback value.
  const initialEmail =
    location.state?.email ||
    new URLSearchParams(location.search).get('email') ||
    window.localStorage.getItem('verifyEmail') ||
    '';

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputs = useRef([]);

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Persist email when arriving here so refreshes still keep the same address.
  useEffect(() => {
    if (initialEmail) {
      window.localStorage.setItem('verifyEmail', initialEmail);
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Auto-focus first box on mount
  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError('');
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (!email) {
      setError('Email is missing. Please go back to registration or login and try again.');
      return;
    }
    if (otp.length < 6) { setError('Please enter all 6 digits.'); return; }

    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, otp);
      window.localStorage.removeItem('verifyEmail');
      setToast('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || 'Invalid or expired OTP. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email is missing. Please go back to registration or login and try again.');
      return;
    }
    if (resendCooldown > 0) return;
    try {
      await resendOTP(email);
      setResendCooldown(30);
      setError('');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch {
      setError('Failed to resend OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center px-4">

      {/* Success toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg text-sm font-medium z-50 animate-bounce">
          ✅ {toast}
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl shadow-lg mb-3">
            <span className="text-2xl">📬</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-1">
            We've sent a 6-digit code to{' '}
            <span className="font-semibold text-orange-500">{email || 'your email'}</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl px-8 py-8">
          <form onSubmit={handleVerify} noValidate>

            {/* OTP digit boxes */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition focus:outline-none
                    ${d
                      ? 'border-orange-400 bg-orange-50 text-orange-600'
                      : 'border-gray-200 bg-white text-gray-800'}
                    ${error ? 'border-red-300' : ''}
                    focus:border-orange-400`}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : 'Verify & Continue →'}
            </button>
          </form>

          {/* Resend */}
          <div className="text-center mt-5 text-sm">
            {resendCooldown > 0 ? (
              <p className="text-gray-400">
                Resend OTP in <span className="font-semibold text-orange-500">{resendCooldown}s</span>
              </p>
            ) : (
              <button onClick={handleResend} className="text-orange-500 hover:underline font-medium">
                Didn't receive it? Resend OTP
              </button>
            )}
          </div>

          <div className="text-center mt-3">
            <Link to="/register" className="text-xs text-gray-400 hover:text-gray-600">
              ← Back to registration
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Check your spam folder if you don't see the email.
        </p>
      </div>
    </div>
  );
}

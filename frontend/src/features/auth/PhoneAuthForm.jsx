import { useState, useRef, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../../firebase';
import apiClient from '../../api/apiClient';

function getPhoneAuthErrorMessage(err) {
  const code = err?.code || '';

  if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
    return 'Phone Authentication is not enabled in Firebase Console. Enable Authentication > Sign-in method > Phone.';
  }
  if (code === 'auth/invalid-app-credential') {
    return 'reCAPTCHA verification failed. Refresh the page and try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }

  return err?.message || 'Failed to send OTP. Try again.';
}

export default function PhoneAuthForm({ onSuccess }) {
  const [phone, setPhone]               = useState('');
  const [otp, setOtp]                   = useState('');
  const [step, setStep]                 = useState('phone'); // 'phone' | 'otp'
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const verifierRef = useRef(null);
  const timerRef    = useRef(null);

  // Cleanup verifier + timer on unmount
  useEffect(() => {
    return () => {
      if (verifierRef.current) verifierRef.current.clear();
      clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setResendCooldown(30);
    timerRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const getVerifier = () => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          verifierRef.current = null;
        },
      });
    }
    return verifierRef.current;
  };

  // ── Step 1: Send OTP via Firebase ─────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    // Ensure E.164 format (e.g. +919876543210)
    const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
    if (!/^\+[1-9]\d{7,14}$/.test(formatted)) {
      setError('Enter a valid phone number (10 digits).');
      return;
    }

    setLoading(true);
    try {
      const appVerifier = getVerifier();
      const result      = await signInWithPhoneNumber(auth, formatted, appVerifier);
      setConfirmationResult(result);
      setStep('otp');
      startCooldown();
    } catch (err) {
      setError(getPhoneAuthErrorMessage(err));
      if (verifierRef.current) { verifierRef.current.clear(); verifierRef.current = null; }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Confirm OTP + verify token on backend ─────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }

    setLoading(true);
    try {
      // Confirm code with Firebase
      const credential = await confirmationResult.confirm(otp);
      // Get short-lived ID token
      const idToken    = await credential.user.getIdToken();

      // Send to Spring Boot backend for server-side verification
      const { data } = await apiClient.post('/auth/firebase/verify-token', { idToken });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ email: data.email, name: data.name }));

      if (onSuccess) onSuccess(data);
      else window.location.href = '/';
    } catch (err) {
      setError('Invalid OTP or verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    if (verifierRef.current) { verifierRef.current.clear(); verifierRef.current = null; }
    setOtp('');
    setStep('phone');
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Invisible reCAPTCHA mount point — must be in the DOM */}
      <div id="recaptcha-container" />

      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-md bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="9876543210"
                maxLength={10}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Enter the 6-digit code sent to <span className="font-medium text-gray-800">+91{phone}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center text-xl tracking-[0.5em] font-mono"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <div className="text-center">
            {resendCooldown > 0 ? (
              <span className="text-sm text-gray-400">Resend in {resendCooldown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-orange-600 hover:underline"
              >
                Change number / Resend OTP
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

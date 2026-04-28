import { useState, useRef } from 'react';
import Button from '../common/Button';
import { resendOTP } from '../../api/authApi';

export default function OTPModal({ email, onVerify, onClose }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const inputs = useRef([]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      await onVerify({ email, otp: code });
    } catch {
      setError('Invalid or expired OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP(email);
      setResendMsg('OTP resent! Check your email.');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch {
      setResendMsg('Failed to resend. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Verify your email</h2>
        <p className="text-sm text-gray-500 mb-6">
          Enter the 6-digit OTP sent to <span className="font-medium text-brand-500">{email}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 justify-center mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="w-10 h-12 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:border-brand-500 transition"
              />
            ))}
          </div>

          {error && <p className="text-xs text-red-500 text-center mb-3">{error}</p>}
          {resendMsg && <p className="text-xs text-green-600 text-center mb-3">{resendMsg}</p>}

          <Button type="submit" loading={loading} className="w-full justify-center">
            Verify OTP
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={handleResend} className="text-brand-500 hover:underline">
            Resend OTP
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

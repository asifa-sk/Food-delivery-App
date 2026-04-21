import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { requestPasswordResetOtp, resetPasswordWithOtp } from '../api/authApi';
import { isValidEmail, isValidOTP, isValidPassword } from '../utils/validation';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const canReset = useMemo(() => {
    return isValidOTP(otp) && isValidPassword(newPassword) && newPassword === confirmPassword;
  }, [otp, newPassword, confirmPassword]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordResetOtp(email.trim());
      setSuccess('OTP sent to your email.');
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!canReset) {
      if (!isValidOTP(otp)) {
        setError('Enter a valid 6-digit OTP.');
      } else if (!isValidPassword(newPassword)) {
        setError('Password must be at least 8 characters with at least 1 letter and 1 number.');
      } else {
        setError('Password and confirm password must match.');
      }
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp(email.trim(), otp.trim(), newPassword);
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">🔐</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Forgot Password</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'request' ? 'Get OTP to reset your password' : 'Enter OTP and set a new password'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-xl mb-4">
            <span>✅</span> {success}
          </div>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4" noValidate>
            <Input
              id="email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full justify-center mt-2">
              Send Reset OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-4" noValidate>
            <Input
              id="email"
              type="email"
              label="Email address"
              value={email}
              disabled
              onChange={() => {}}
            />
            <Input
              id="otp"
              type="text"
              label="OTP"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <Input
              id="newPassword"
              type="password"
              label="New Password"
              placeholder="Min 8 chars, 1 letter + 1 number"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              id="confirmPassword"
              type="password"
              label="Confirm Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full justify-center mt-2">
              Reset Password
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Back to{' '}
          <Link to="/login" className="text-orange-500 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

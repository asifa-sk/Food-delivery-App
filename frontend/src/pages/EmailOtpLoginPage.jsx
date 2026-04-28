import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { requestLoginOtp, verifyLoginOtp } from '../api/authApi';
import { isValidEmail, isValidOTP } from '../utils/validation';

export default function EmailOtpLoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const canVerify = useMemo(() => isValidOTP(otp), [otp]);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await requestLoginOtp(email.trim());
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!canVerify) {
      setError('Enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await verifyLoginOtp(email.trim(), otp.trim());
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      if (data?.name || data?.email) {
        localStorage.setItem('user', JSON.stringify({ name: data.name, email: data.email }));
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendLoading(true);
    try {
      await requestLoginOtp(email.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">📧</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">Email OTP Login</h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'request'
              ? 'Get a one-time code in your inbox'
              : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">
            <span>⚠️</span> {error}
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
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4" noValidate>
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
            <Button type="submit" loading={loading} className="w-full justify-center mt-2">
              Login with OTP
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={resendLoading}
              onClick={handleResendOtp}
              className="w-full justify-center"
            >
              Resend OTP
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Prefer password login?{' '}
          <Link to="/login" className="text-brand-500 font-semibold hover:underline">
            Go to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

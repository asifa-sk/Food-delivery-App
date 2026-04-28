import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateLoginForm } from '../../utils/validation';
import { loginUser } from '../../api/authApi';
import { getHomeRouteForRole, normalizeRole } from '../../utils/roleUtils';

export default function LoginForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [notVerified, setNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: '' });
    setNotVerified(false);
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setServerError('');
    setNotVerified(false);
    try {
      const { data } = await loginUser(form);
      if (data?.token) localStorage.setItem('token', data.token);
      const userPayload = data.user || {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      localStorage.setItem('user', JSON.stringify(userPayload));
      const role = normalizeRole(userPayload.role);
      navigate(getHomeRouteForRole(role), { replace: true });
    } catch (err) {
      console.error('Login error', err);
      const status = err.response?.status;
      const body = err.response?.data || {};
      const message = body.message || body.error || body.debugMessage || '';
      const email = body.email || form.email;

      // 403 = account exists but not verified
      if (status === 403) {
        setNotVerified(true);
        setServerError(message || 'Account not verified. Please verify your email first.');
        // Store email so user can click through to verify-otp
        navigate('/verify-otp', { state: { email } });
        return;
      }
      setServerError(message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && !notVerified && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
          <span>⚠️</span> {serverError}
        </div>
      )}

      {notVerified && (
        <div className="bg-accent-100 border border-accent-200 text-brand-700 text-sm px-4 py-3 rounded-xl">
          <p className="font-semibold mb-1">Account not verified</p>
          <p>Please verify your email before logging in.{' '}
            <Link
              to="/verify-otp"
              state={{ email: form.email }}
              className="underline font-medium text-brand-600 hover:text-brand-700"
            >
              Verify now →
            </Link>
          </p>
        </div>
      )}

      <Input
        id="email"
        label="Email address"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
      />
      <div className="flex items-center justify-between -mt-1">
        <Link to="/email-otp-login" className="text-xs text-brand-600 hover:underline font-medium">
          Login with Email OTP
        </Link>
        <Link to="/forgot-password" className="text-xs text-gray-500 hover:text-brand-600 hover:underline font-medium">
          Forgot Password?
        </Link>
      </div>
      <Button type="submit" loading={loading} className="w-full justify-center mt-2">
        Login
      </Button>
    </form>
  );
}

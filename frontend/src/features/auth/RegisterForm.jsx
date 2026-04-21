import { useState } from 'react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateRegisterForm } from '../../utils/validation';
import { registerUser } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';

export default function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    setServerError('');
    try {
      await registerUser(form);
      // Navigate to OTP page and pass email in router state
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {serverError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
          <span>⚠️</span> {serverError}
        </div>
      )}
      <Input id="name" label="Full Name" placeholder="John Doe" value={form.name} onChange={handleChange} error={errors.name} />
      <Input id="email" label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} />
      <Input id="password" label="Password" type="password" placeholder="Min 8 chars, 1 letter + 1 number" value={form.password} onChange={handleChange} error={errors.password} />
      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium text-gray-700">Account type</label>
        <select
          id="role"
          value={form.role}
          onChange={handleChange}
          className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="customer">Customer</option>
          <option value="restaurant">Restaurant</option>
        </select>
      </div>
      <Button type="submit" loading={loading} className="w-full justify-center mt-2">
        Create Account
      </Button>
    </form>
  );
}

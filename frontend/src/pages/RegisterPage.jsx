import { Link } from 'react-router-dom';
import RegisterForm from '../features/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center px-4 py-8">

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl shadow-lg mb-3">
            <span className="text-2xl">🍕</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Create your Foodyy account</h1>
          <p className="text-gray-500 text-sm mt-1">Join Foodyy and get food delivered fast</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl px-8 py-8">
          <RegisterForm />

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-500 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

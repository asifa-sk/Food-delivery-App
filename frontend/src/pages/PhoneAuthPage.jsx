import PhoneAuthForm from '../features/auth/PhoneAuthForm';

export default function PhoneAuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-accent-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📱</div>
          <h1 className="text-2xl font-bold text-gray-900">Phone Sign In</h1>
          <p className="text-sm text-gray-500 mt-1">
            We'll send a verification code to your phone
          </p>
        </div>

        <PhoneAuthForm />

        <p className="text-center text-sm text-gray-400 mt-6">
          Prefer email?{' '}
          <a href="/login" className="text-brand-600 hover:underline font-medium">
            Sign in with email
          </a>
        </p>
      </div>
    </div>
  );
}

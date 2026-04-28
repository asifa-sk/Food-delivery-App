export default function Button({ children, type = 'button', variant = 'primary', loading = false, disabled = false, onClick, className = '' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white';
  const variants = {
    primary: 'bg-brand-500 text-white shadow-glow hover:bg-brand-400 focus:ring-brand-300',
    secondary: 'border border-brand-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus:ring-brand-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300',
    outline: 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 focus:ring-brand-200',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${disabled || loading ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading...
        </>
      ) : children}
    </button>
  );
}

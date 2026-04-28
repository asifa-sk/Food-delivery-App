export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label ? (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-2xl border px-4 py-3 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 bg-red-50 text-red-700 focus:ring-red-200'
            : 'border-brand-200 bg-white/90 text-slate-800 focus:border-brand-400 focus:ring-brand-200'
        } ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
        {...rest}
      />
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </div>
  );
}

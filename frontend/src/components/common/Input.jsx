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
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition
          ${error
            ? 'border-red-400 focus:ring-red-300 bg-red-50'
            : 'border-gray-300 focus:ring-orange-300 bg-white'
          }
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}`}
        {...rest}
      />
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}

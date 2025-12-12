// src/components/Input.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Universal Input Component for Hybrid MLM Frontend
 *
 * Supports:
 * - label
 * - error message
 * - left/right icons
 * - password visibility toggle
 * - numeric, email, mobile validation (native)
 * - full form compatibility (Signup, Login, EPIN, Package, KYC)
 *
 * Props:
 *  label: string
 *  type: text | number | password | email | tel
 *  value: state value
 *  onChange: fn
 *  placeholder: string
 *  disabled: boolean
 *  error: string
 *  leftIcon: node
 *  rightIcon: node
 *  required: boolean
 */

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  error = '',
  leftIcon,
  rightIcon,
  required = false,
  className = '',
  ...rest
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  const actualType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`w-full mb-3 ${className}`}>
      {/* Label */}
      {label && (
        <label
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        className={`relative flex items-center rounded-xl border transition-all bg-white
        ${error ? "border-red-400 shadow-sm" : "border-slate-300 focus-within:border-blue-500"}
        `}
      >

        {/* Left Icon */}
        {leftIcon && (
          <span className="absolute left-3 text-slate-400 text-lg">
            {leftIcon}
          </span>
        )}

        {/* Input */}
        <input
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full px-4 py-2.5 rounded-xl bg-transparent text-slate-800
            outline-none placeholder:text-slate-400
            ${leftIcon ? "pl-10" : "pl-4"}
            ${rightIcon || type === "password" ? "pr-10" : "pr-4"}
            ${disabled ? "bg-slate-100 cursor-not-allowed" : ""}
          `}
          {...rest}
        />

        {/* Password Toggle */}
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-slate-500 hover:text-slate-700"
            tabIndex={-1}
          >
            {showPassword ? "👁️" : "🙈"}
          </button>
        )}

        {/* Right Icon (custom) */}
        {!type.includes("password") && rightIcon && (
          <span className="absolute right-3 text-slate-400 text-lg">
            {rightIcon}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}

Input.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  required: PropTypes.bool,
  className: PropTypes.string,
};

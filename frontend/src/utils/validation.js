// Email validation
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Phone number validation (10-digit Indian mobile)
export const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test(phone);

// Password: min 8 chars, at least 1 letter and 1 number
export const isValidPassword = (password) =>
  /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);

// OTP: exactly 6 digits
export const isValidOTP = (otp) =>
  /^\d{6}$/.test(otp);

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!email) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Invalid email address';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
};

export const validateRegisterForm = ({ name, email, password }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Invalid email address';
  if (!password) errors.password = 'Password is required';
  else if (!isValidPassword(password))
    errors.password = 'Min 8 characters with at least 1 letter and 1 number';
  return errors;
};

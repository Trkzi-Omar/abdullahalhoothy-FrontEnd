import * as yup from 'yup';
import { emailRegex, isValidPhone } from './validation';

export const emailSchema = yup
  .string()
  .required('Email is required')
  .matches(emailRegex, 'Please enter a valid email');

export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required('Password is required'),
});

export const registerStep1Schema = yup.object({
  email: emailSchema,
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

export const registerStep2Schema = yup.object({
  name: yup
    .string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  phone: yup
    .string()
    .optional()
    .test('phone', 'Please enter a valid phone number', function(value) {
      // Only validate if phone is provided
      if (!value || value === '' || value === '+') {
        return true;
      }
      // Treat country-code-only values (1-3 digits after +) as empty/optional
      const phoneWithoutPlus = value.replace(/^\+/, '').replace(/\s/g, '');
      if (phoneWithoutPlus.length <= 3) {
        return true; // Just country code, treat as optional
      }
      // Validate complete phone numbers
      return isValidPhone(value);
    }),
});

export const resetSchema = yup.object({
  email: emailSchema,
});

// Sync validation helpers for button disabled state
export const isValidEmail = (email: string) => emailSchema.isValidSync(email);

export const isLoginValid = (email: string, password: string) =>
  loginSchema.isValidSync({ email, password });

export const isRegisterStep1Valid = (email: string, password: string, confirmPassword: string) =>
  registerStep1Schema.isValidSync({ email, password, confirmPassword });

export const isRegisterStep2Valid = (name: string, phone: string) =>
  registerStep2Schema.isValidSync({ name, phone });

import * as yup from 'yup';
import { emailRegex, isValidPhone } from './validation';
import { t } from '../i18n';

export const emailSchema = yup
  .string()
  .required(t("email-is-required"))
  .matches(emailRegex, t("please-enter-a-valid-email"));

export const passwordSchema = yup
  .string()
  .required(t("password-is-required"))
  .min(8, t("password-must-be-at-least-8-characters"));

export const loginSchema = yup.object({
  email: emailSchema,
  password: yup.string().required(t("password-is-required")),
});

export const registerStep1Schema = yup.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: yup
    .string()
    .required(t("please-confirm-your-password"))
    .oneOf([yup.ref('password')], t("passwords-must-match")),
});

export const registerStep2Schema = yup.object({
  name: yup
    .string()
    .required(t("full-name-is-required"))
    .min(2, t("name-must-be-at-least-2-characters")),
  phone: yup
    .string()
    .optional()
    .test('phone', t("please-enter-a-valid-phone-number"), function(value) {
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

export const getChangePasswordDisabledReason = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    return t("fill-in-all-password-fields");
  }
  if (!passwordSchema.isValidSync(newPassword)) {
    return t("new-password-must-be-at-least-8-characters");
  }
  if (confirmPassword !== newPassword) {
    return t("confirmation-must-match-the-new-password");
  }
  if (currentPassword === newPassword) {
    return t("new-password-must-be-different-from-current-password");
  }
  return null;
};

export const isChangePasswordValid = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) => getChangePasswordDisabledReason(currentPassword, newPassword, confirmPassword) === null;

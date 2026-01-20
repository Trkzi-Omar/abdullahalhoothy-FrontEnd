export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// Phone validation for international format (with + prefix)
const intlPhoneRegex = /^\+[1-9]\d{6,14}$/;

export function isValidPhone(value: string | undefined): boolean {
  if (!value || value === '' || value === '+') return true;
  // Phone should be in format: +[country code][number] (e.g., "+966501234567")
  const cleanedValue = value.replace(/\s/g, '');
  return intlPhoneRegex.test(cleanedValue);
}

export function normalizePhone(phone: string): string {
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  return hasPlus ? `+${digits}` : digits;
}

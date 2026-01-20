import { useState, useEffect, useCallback } from 'react';
import * as yup from 'yup';
import { emailRegex, isValidPhone } from '../utils/validation';

export interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
}

export const initialFormState: FormState = {
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
};

export type AuthMode = 'login' | 'register' | 'reset';

interface UseAuthFormOptions {
  mode: AuthMode;
  registerStep?: number;
}

export function useAuthForm({ mode, registerStep = 1 }: UseAuthFormOptions) {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof FormState>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced validation effect
  useEffect(() => {
    if (touchedFields.size === 0) return;

    const timer = setTimeout(() => {
      const errors: Partial<Record<keyof FormState, string>> = {};

      // Validate touched fields based on current mode/step
      if (touchedFields.has('email') && form.email) {
        if (!emailRegex.test(form.email)) {
          errors.email = 'Please enter a valid email';
        }
      }

      if (mode === 'register' && registerStep === 1) {
        if (touchedFields.has('password') && form.password) {
          if (form.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
          }
        }
        if (touchedFields.has('confirmPassword') && form.confirmPassword) {
          if (form.confirmPassword !== form.password) {
            errors.confirmPassword = 'Passwords must match';
          }
        }
      }

      if (mode === 'register' && registerStep === 2) {
        if (touchedFields.has('name') && form.name && form.name.length < 2) {
          errors.name = 'Name must be at least 2 characters';
        }
        if (touchedFields.has('phone') && form.phone) {
          if (!isValidPhone(form.phone)) {
            errors.phone = 'Please enter a valid phone number';
          }
        }
      }

      setFieldErrors(errors);
    }, 300);

    return () => clearTimeout(timer);
  }, [form, mode, registerStep, touchedFields]);

  const updateForm = useCallback((field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => new Set(prev).add(field));
    // Clear error immediately when user starts typing
    setFieldErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm(initialFormState);
    setError(null);
    setFieldErrors({});
    setTouchedFields(new Set());
  }, []);

  const validateForm = useCallback(async (
    schema: yup.ObjectSchema<any>,
    data: Partial<FormState>
  ): Promise<boolean> => {
    try {
      await schema.validate(data, { abortEarly: false });
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const errors: Partial<Record<keyof FormState, string>> = {};
        err.inner.forEach(e => {
          if (e.path) {
            errors[e.path as keyof FormState] = e.message;
          }
        });
        setFieldErrors(errors);
      }
      return false;
    }
  }, []);

  // Handle phone input change (PhoneInput returns value without + prefix)
  const handlePhoneChange = useCallback((phoneValue: string) => {
    const formattedPhone = phoneValue ? `+${phoneValue}` : '';
    setForm(prev => ({ ...prev, phone: formattedPhone }));
    setTouchedFields(prev => new Set(prev).add('phone'));
    setFieldErrors(prev => {
      if (prev.phone) {
        return { ...prev, phone: undefined };
      }
      return prev;
    });
  }, []);

  return {
    form,
    setForm,
    fieldErrors,
    setFieldErrors,
    touchedFields,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateForm,
    resetForm,
    validateForm,
    handlePhoneChange,
  };
}

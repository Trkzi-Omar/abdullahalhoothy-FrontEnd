import { useState } from 'react';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { toast } from 'sonner';
import { useAuthForm } from '../../hooks/useAuthForm';
import {
  registerStep1Schema,
  registerStep2Schema,
  isRegisterStep1Valid,
  isRegisterStep2Valid,
} from '../../utils/auth.validation';
import { performRegistration } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import { useOTP } from '../../context/OTPContext';
import { PhoneInput } from '../common/PhoneInput';
import styles from '../../pages/Auth/Auth.module.css';

interface RegisterFormProps {
  onSuccess: () => void;
  source?: string | null;
}

export const RegisterForm = ({ onSuccess, source }: RegisterFormProps) => {
  const { setAuthResponse } = useAuth();
  const { openOTPModal } = useOTP();
  const [registerStep, setRegisterStep] = useState(1);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const {
    form,
    fieldErrors,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateForm,
    validateForm,
    handlePhoneChange,
  } = useAuthForm({ mode: 'register', registerStep });

  const doRegistration = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await performRegistration(setAuthResponse, {
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || '',
        source: source || '',
      });
      toast.success('Registration successful! Please verify your email.', { duration: 3000 });
      onSuccess();
    } catch (e: any) {
      const msg = e.message || 'Registration failed. Please try again.';
      setError(msg);
      toast.error(msg, { duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Step 1: Validate email/password, move to step 2
    if (registerStep === 1) {
      const isValid = await validateForm(registerStep1Schema, {
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      if (!isValid) return;
      setRegisterStep(2);
      return;
    }

    // Step 2: Validate name and phone, submit registration
    const isValid = await validateForm(registerStep2Schema, {
      name: form.name,
      phone: form.phone,
    });
    if (!isValid) return;

    // If phone number is provided and not yet verified, trigger OTP verification
    if (form.phone && form.phone.trim() !== '' && form.phone !== '+' && !isPhoneVerified) {
      openOTPModal(
        form.phone,
        () => {
          setIsPhoneVerified(true);
          doRegistration();
        },
        () => {
          toast.info('Phone verification skipped. You can verify later in your profile.');
          doRegistration();
        }
      );
    } else {
      doRegistration();
    }
  };

  // Step 1: Email & Password
  if (registerStep === 1) {
    return (
      <>
        {error && <p className="mb-4 text-center text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <div className={styles.inputGroup}>
              <FaEnvelope className={styles.icon} />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => updateForm('email', e.target.value)}
                className={styles.authInput}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <div className={styles.inputGroup}>
              <FaLock className={styles.icon} />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={e => updateForm('password', e.target.value)}
                className={styles.authInput}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
            )}
          </div>
          <div>
            <div className={styles.inputGroup}>
              <FaLock className={styles.icon} />
              <input
                type="password"
                placeholder="Confirm Password"
                value={form.confirmPassword}
                onChange={e => updateForm('confirmPassword', e.target.value)}
                className={styles.authInput}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 sm:py-3 text-base sm:text-lg text-white bg-[#155315] rounded-md hover:bg-[#1a651a] disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={!isRegisterStep1Valid(form.email, form.password, form.confirmPassword)}
          >
            Continue with email
          </button>
        </form>
      </>
    );
  }

  // Step 2: Name & Phone
  return (
    <>
      {error && <p className="mb-4 text-center text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <div className="flex items-center bg-[#f0f8f0] rounded-md">
            <FaUser className="text-[#006400] ml-3" />
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              className="flex-1 px-3 py-2 text-base sm:text-lg bg-transparent outline-none"
            />
          </div>
          {fieldErrors.name && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (Optional)
          </label>
          <PhoneInput
            value={form.phone}
            onChange={handlePhoneChange}
            error={fieldErrors.phone}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setRegisterStep(1)}
            className="px-4 py-2.5 sm:py-3 text-base sm:text-lg text-[#006400] bg-white border border-[#006400] rounded-md hover:bg-[#f0f8f0]"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 sm:py-3 text-base sm:text-lg text-white bg-[#155315] rounded-md hover:bg-[#1a651a] disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isLoading || !isRegisterStep2Valid(form.name, form.phone)}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </>
  );
};

export default RegisterForm;

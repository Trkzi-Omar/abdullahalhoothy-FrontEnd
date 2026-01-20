import { FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuthForm } from '../../hooks/useAuthForm';
import { loginSchema, isLoginValid } from '../../utils/auth.validation';
import { performLogin } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import styles from '../../pages/Auth/Auth.module.css';

interface LoginFormProps {
  onSuccess: () => void;
  onForgotPassword: () => void;
}

export const LoginForm = ({ onSuccess, onForgotPassword }: LoginFormProps) => {
  const { setAuthResponse } = useAuth();
  const {
    form,
    fieldErrors,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateForm,
    validateForm,
  } = useAuthForm({ mode: 'login' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValid = await validateForm(loginSchema, {
      email: form.email,
      password: form.password,
    });
    if (!isValid) return;

    setIsLoading(true);
    try {
      await performLogin(setAuthResponse, {
        isGuest: false,
        email: form.email,
        password: form.password,
      });
      onSuccess();
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

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
        <button
          type="submit"
          className="px-4 py-2.5 sm:py-3 text-base sm:text-lg text-white bg-[#155315] rounded-md hover:bg-[#1a651a] disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading || !isLoginValid(form.email, form.password)}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="flex justify-center mt-6">
        <button
          onClick={onForgotPassword}
          className="text-[#006400] text-sm hover:underline"
        >
          Forgot Password?
        </button>
      </div>
    </>
  );
};

export default LoginForm;

import { FaEnvelope } from 'react-icons/fa';
import { toast } from 'sonner';
import { useAuthForm } from '../../hooks/useAuthForm';
import { resetSchema, isValidEmail } from '../../utils/auth.validation';
import { HttpReq } from '../../services/apiService';
import urls from '../../urls.json';
import styles from '../../pages/Auth/Auth.module.css';

interface ResetPasswordFormProps {
  onSuccess: () => void;
  onBackToLogin: () => void;
}

export const ResetPasswordForm = ({ onSuccess, onBackToLogin }: ResetPasswordFormProps) => {
  const {
    form,
    fieldErrors,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateForm,
    validateForm,
  } = useAuthForm({ mode: 'reset' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValid = await validateForm(resetSchema, { email: form.email });
    if (!isValid) return;

    setIsLoading(true);
    try {
      await HttpReq(
        urls.reset_password,
        () => {},
        () => {},
        () => {},
        () => {},
        () => {},
        'post',
        { email: form.email }
      );
      toast.success('Password reset email sent. Please check your inbox.');
      onSuccess();
    } catch {
      setError('Failed to send reset email. Please try again.');
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
        <button
          type="submit"
          className={styles.authButton}
          disabled={isLoading || !isValidEmail(form.email)}
        >
          {isLoading ? 'Sending...' : 'Reset Password'}
        </button>
      </form>
      <div className="flex justify-center mt-6">
        <button
          onClick={onBackToLogin}
          className="text-[#006400] text-sm hover:underline"
        >
          Back to Login
        </button>
      </div>
    </>
  );
};

export default ResetPasswordForm;

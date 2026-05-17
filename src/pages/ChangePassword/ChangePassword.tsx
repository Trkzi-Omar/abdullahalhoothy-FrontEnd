import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router';
import urls from './../../urls.json';
import apiRequest from '../../services/apiRequest';
import {
  getChangePasswordDisabledReason,
  isChangePasswordValid,
  passwordSchema,
} from '../../utils/auth.validation';
import { t } from '../../i18n';
import { translateError } from '../../utils/apiMessages';


const ChangePassword: React.FC = () => {
  const { authResponse } = useAuth();

  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();

  const disabledReason = loading
    ? 'Password change is in progress'
    : getChangePasswordDisabledReason(currentPassword, newPassword, confirmPassword);
  const isSubmitDisabled =
    loading || !isChangePasswordValid(currentPassword, newPassword, confirmPassword);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const data = {
      password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    };
    if (data.password === '' || data.new_password === '' || data.confirm_password === '') {
      setError({
        message:t("all-fields-are-required"),
        name: 'All fields are required',
      });
      return;
    }
    if (data.new_password !== data.confirm_password) {
      setError({
        message:t("passwords-do-not-match"),
        name: 'Passwords do not match',
      });
      return;
    }
    try {
      await passwordSchema.validate(data.new_password);
    } catch (error) {
      if (error instanceof Error) {
        setError(error);
        return;
      }
    }
    if (data.password === data.new_password) {
      setError({
        message:t("new-password-must-be-different-from-current-password"),
        name: 'New password must be different from current password',
      });
      return;
    }
    data.user_id = authResponse?.localId;
    data.email = authResponse?.email;
    setLoading(true);
    try {
      const res = await apiRequest({
        url: urls.change_password,
        method: 'post',
        body: data,
        isAuthRequest: true,
        suppressAuthRedirectOn401: true,
      });
      if (res.status === 200) {
        navigate('/auth');
      }
    } catch (error) {
      const status = (error as { status?: number; response?: { status?: number } })?.status
        ?? (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setError(new Error(t("current-password-is-incorrect")));
      } else {
        setError(new Error(translateError(error, "request-failed")));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="mx-2 max-w-96 space-y-1 mb-4">
        <h2 className="text-2xl font-semibold text-gray-700 ">{t("change-password")}</h2>
      </div>
      <form
        className="p-4 sm:rounded-lg border bg-white shadow mx-2 w-full sm:max-w-96"
        onSubmit={handleSubmit}
      >
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="current-password">{t("current-password")}</label>
          <input
            type="password"
            id="current-password"
            name="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="new-password">{t("new-password")}</label>
          <input
            type="password"
            id="new-password"
            name="new_password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="confirm-password">{t("confirm-new-password")}</label>
          <input
            type="password"
            id="confirm-password"
            name="confirm_password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>
        {error && (
          <p className="text-red-500 text-sm mb-4">
            {error?.response?.data?.detail || error?.message}
          </p>
        )}
        <div title={isSubmitDisabled ? disabledReason ?? undefined : undefined}>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitDisabled}
          >
            {loading ?t("changing-password") :t("change-password")}
          </button>
        </div>
        {isSubmitDisabled && disabledReason && !error && (
          <p className="mt-2 text-sm text-gray-500">{disabledReason}</p>
        )}
      </form>
    </div>
  );
};

export default ChangePassword;

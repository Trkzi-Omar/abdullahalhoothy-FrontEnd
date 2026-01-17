import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import FirstPage from './FirstPage';
import SecondPage from './SecondPage';
import { useSignUp } from '../../../context/SignUpContext';
import { useAuth, performGoogleLogin } from '../../../context/AuthContext';

const SignUpForm: React.FC = () => {
  const { currentPage, handleNext, handlePrevious, handleSubmit, isSubmitting, submitError } =
    useSignUp();
  const { setAuthResponse, sourceLocal } = useAuth();
  const navigate = useNavigate();

  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setGoogleError('Google sign up failed: No credential received');
      return;
    }
    setGoogleError(null);

    try {
      await performGoogleLogin(setAuthResponse, response.credential, sourceLocal);
      navigate('/');
    } catch (e: any) {
      setGoogleError(e.response?.data?.detail || e.message || 'Google sign up failed');
    }
  };

  return (
    <div className="rounded-lg shadow-[0px_0px_10px_0px_rgba(0,0,0,0.5)] p-8 lg:w-1/3">
      <div className="flex justify-end mb-6">
        <p className="text-sm text-gray-300">
          Already have an account?{' '}
          <Link
            to="/auth"
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-150 ease-in-out"
          >
            Sign In
          </Link>
        </p>
      </div>

      {currentPage === 0 && (
        <>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setGoogleError('Google sign up failed')}
            size="large"
            width="100%"
            text="continue_with"
          />

          {googleError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {googleError}
            </div>
          )}

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-500"></div>
            <span className="px-3 text-gray-400 text-sm">or sign up with email</span>
            <div className="flex-1 border-t border-gray-500"></div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {currentPage === 0 ? <FirstPage /> : <SecondPage />}

        {submitError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {submitError}
          </div>
        )}

        <div className="flex sm:flex-col gap-2 justify-between mt-6">
          {currentPage === 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Previous
            </button>
          )}

          <button
            type={currentPage === 1 ? 'submit' : 'button'}
            onClick={currentPage === 0 ? handleNext : undefined}
            disabled={isSubmitting}
            className="w-auto flex-grow px-4 py-2 text-sm font-medium text-white bg-secondary border border-transparent rounded-md hover:bg-focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : currentPage === 1 ? 'Submit' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm;

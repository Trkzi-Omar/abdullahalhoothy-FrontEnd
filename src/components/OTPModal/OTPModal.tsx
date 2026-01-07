import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useOTP } from '../../context/OTPContext';

const OTPModal: React.FC = () => {
  const { state, isModalOpen, verifyOTP, resendOTP, closeOTPModal } = useOTP();
  const [otp, setOtp] = useState<string[]>(Array(state.codeLength).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset OTP inputs when modal opens or code length changes
  useEffect(() => {
    if (isModalOpen) {
      setOtp(Array(state.codeLength).fill(''));
      // Focus first input after a brief delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isModalOpen, state.codeLength]);

  // Reset OTP on error
  useEffect(() => {
    if (state.status === 'error') {
      setOtp(Array(state.codeLength).fill(''));
      inputRefs.current[0]?.focus();
    }
  }, [state.status, state.codeLength]);

  // Handle individual input change
  const handleChange = useCallback((index: number, value: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle paste of multiple digits
    if (value.length > 1) {
      const digits = value.split('').slice(0, state.codeLength - index);
      digits.forEach((digit, i) => {
        if (index + i < state.codeLength) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus next empty input or last input
      const nextIndex = Math.min(index + digits.length, state.codeLength - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value entered
    if (value && index < state.codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp, state.codeLength]);

  // Handle keydown for backspace navigation
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < state.codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  }, [otp, state.codeLength]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, state.codeLength);
    
    if (pastedData) {
      const newOtp = Array(state.codeLength).fill('');
      pastedData.split('').forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      // Focus last filled input or next empty
      const focusIndex = Math.min(pastedData.length, state.codeLength - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  }, [state.codeLength]);

  // Handle verify
  const handleVerify = useCallback(async () => {
    const code = otp.join('');
    if (code.length === state.codeLength) {
      await verifyOTP(code);
    }
  }, [otp, state.codeLength, verifyOTP]);

  // Handle resend
  const handleResend = useCallback(async () => {
    await resendOTP();
    setOtp(Array(state.codeLength).fill(''));
    inputRefs.current[0]?.focus();
  }, [resendOTP, state.codeLength]);

  if (!isModalOpen) return null;

  const isComplete = otp.every(digit => digit !== '');
  const isSending = state.status === 'sending';
  const isVerifying = state.status === 'verifying';
  const isSuccess = state.status === 'success';
  const canResend = state.resendCooldown === 0 && state.retryCount < state.maxRetries;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-overlay-show"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isVerifying && !isSending) {
          closeOTPModal();
        }
      }}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-content-show">
        {/* Close button */}
        <button
          onClick={closeOTPModal}
          disabled={isVerifying || isSending}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-white text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            {isSuccess ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {isSuccess ? 'Verified!' : 'Verify Your Phone'}
          </h2>
          <p className="text-white/80 text-sm">
            {isSuccess 
              ? 'Your phone number has been verified successfully.'
              : `We've sent a ${state.codeLength}-digit code to`
            }
          </p>
          {!isSuccess && (
            <p className="font-mono text-lg mt-1 tracking-wider">{state.maskedPhone}</p>
          )}
        </div>

        {/* Content */}
        {!isSuccess && (
          <div className="px-6 py-6">
            {/* Status indicator */}
            {isSending && (
              <div className="flex items-center justify-center gap-2 text-primary mb-6">
                <Spinner />
                <span>Sending verification code...</span>
              </div>
            )}

            {state.status === 'sent' || state.status === 'error' || isVerifying ? (
              <>
                {/* OTP Input */}
                <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
                  {Array.from({ length: state.codeLength }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index]}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isVerifying}
                      className={`
                        w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 
                        transition-all duration-200 outline-none
                        ${state.status === 'error' && !otp[index]
                          ? 'border-red-400 bg-red-50'
                          : otp[index]
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 bg-gray-50'
                        }
                        focus:border-primary focus:ring-2 focus:ring-primary/20
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Error message */}
                {state.errorMessage && (
                  <div className="flex items-center justify-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"/>
                    </svg>
                    <span>{state.errorMessage}</span>
                  </div>
                )}

                {/* Verify button */}
                <button
                  onClick={handleVerify}
                  disabled={!isComplete || isVerifying}
                  className={`
                    w-full py-3 px-4 rounded-lg font-semibold text-white
                    transition-all duration-200 flex items-center justify-center gap-2
                    ${isComplete && !isVerifying
                      ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30'
                      : 'bg-gray-300 cursor-not-allowed'
                    }
                  `}
                >
                  {isVerifying ? (
                    <>
                      <Spinner />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify Code</span>
                  )}
                </button>

                {/* Resend section */}
                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm mb-2">Didn't receive the code?</p>
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      disabled={isVerifying}
                      className="text-primary font-semibold hover:underline transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Resend Code
                    </button>
                  ) : state.resendCooldown > 0 ? (
                    <span className="text-gray-400">
                      Resend in{' '}
                      <span className="font-mono text-primary">
                        {Math.floor(state.resendCooldown / 60)}:{(state.resendCooldown % 60).toString().padStart(2, '0')}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Maximum attempts reached</span>
                  )}
                  
                  {/* Retry counter */}
                  {state.retryCount > 0 && state.retryCount < state.maxRetries && (
                    <p className="text-xs text-gray-400 mt-2">
                      Attempts: {state.retryCount} / {state.maxRetries}
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Success footer */}
        {isSuccess && (
          <div className="px-6 py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-gray-600">Redirecting...</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// Spinner component
const Spinner: React.FC = () => (
  <svg
    className="animate-spin h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default OTPModal;




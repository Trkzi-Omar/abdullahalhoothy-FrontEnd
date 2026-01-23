import React, { useState, useEffect, useRef } from 'react';
import { useOTP } from '../../../context/OTPContext';
import { toast } from 'sonner';
import { FaPhone, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import apiRequest from '../../../services/apiRequest';
import urls from '../../../urls.json';

interface PhoneVerificationStepProps {
  onVerificationSuccess: (phoneNumber: string) => void;
  disabled?: boolean;
}

const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({
  onVerificationSuccess,
  disabled = false,
}) => {
  const { sendOTP, verifyOTP, state, resetState, isModalOpen, closeOTPModal } = useOTP();
  
  // Store original phone number to use after verification (since OTP context might reset)
  const phoneNumberRef = useRef<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(''));
  const [step, setStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Keep modal closed while this component is active
  // This prevents the global OTPModal from interfering with our inline form
  useEffect(() => {
    // Close modal immediately if it opens
    if (isModalOpen) {
      closeOTPModal();
    }
  }, [isModalOpen, closeOTPModal]);

  // Initialize component - ensure modal is closed but don't reset state completely
  // (resetting state might interfere with our local step management)
  useEffect(() => {
    // Ensure modal is closed on mount
    if (isModalOpen) {
      closeOTPModal();
    }
    // Don't reset state here as it might interfere with our local state management
  }, []); // Only run on mount

  // Handle phone number submission
  const handleSendOTP = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setError(null);
    
    const phoneToSend = phoneNumberRef.current || phoneNumber;
    
    if (!phoneToSend || phoneToSend.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    // Store phone number in ref to preserve it
    phoneNumberRef.current = phoneToSend;

    setIsLoading(true);
    try {
      // Call the OTP sending API directly to avoid any modal interference
      await apiRequest({
        url: urls.sms_send_otp,
        method: 'POST',
        body: {
          phone_number: phoneToSend,
          channel: 'sms',
        },
      });

      // If successful, show OTP input form
      setStep('otp');
      toast.success('Verification code sent to your phone');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to send verification code. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Store the phone number before verification (in case OTP context resets it)
    const phoneToVerify = phoneNumberRef.current || phoneNumber;
    
    try {
      // Call the OTP verification API directly to avoid triggering global callbacks
      // We'll handle the verification ourselves without using the context's verifyOTP
      // which might have callbacks that cause navigation
      const response = await apiRequest({
        url: urls.sms_verify_otp,
        method: 'POST',
        body: {
          phone_number: phoneToVerify,
          code,
        },
      });

      // If verification succeeds, update our local state and call our success callback
      setStep('verified');
      onVerificationSuccess(phoneToVerify);
    } catch (err: any) {
      // Check for 404 (invalid code)
      const errorMessage = err?.response?.status === 404 
        ? 'Invalid verification code. Please try again.'
        : err?.message || 'Verification failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent paste for now (handled separately if needed)
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (step === 'verified') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <FaCheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Phone Verified!</h3>
        <p className="text-gray-600 mb-8 max-w-md">
          Your phone number has been successfully verified. You can now proceed to the next step.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Verify Your Phone
        </h2>
        <p className="text-lg text-gray-600">
          We need to verify your phone number to generate the report.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+966 5X XXX XXXX"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-gem focus:border-gem transition-colors"
                  disabled={isLoading || disabled}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter your mobile number with country code (e.g., +966...)
              </p>
            </div>

            {error && (
              <div className="flex items-center p-4 bg-red-50 rounded-lg text-red-700 text-sm">
                <FaExclamationTriangle className="flex-shrink-0 mr-3" />
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleSendOTP}
              disabled={isLoading || disabled || !phoneNumber}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gem hover:bg-gem/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gem disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Sending Code...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
             <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code sent to <span className="font-semibold">{phoneNumber}</span>
              </p>
              <button
                onClick={() => setStep('phone')}
                className="text-xs text-gem hover:text-gem/80 font-medium underline"
                disabled={isLoading}
              >
                Change Phone Number
              </button>
            </div>

            <div className="flex justify-center gap-2 sm:gap-4 my-6">
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-gem focus:ring-gem outline-none transition-all"
                  disabled={isLoading || disabled}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center p-4 bg-red-50 rounded-lg text-red-700 text-sm">
                <FaExclamationTriangle className="flex-shrink-0 mr-3" />
                {error}
              </div>
            )}

            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || disabled || otpCode.some(d => !d)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gem hover:bg-gem/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gem disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Verifying...' : 'Verify Phone'}
            </button>
            
            <div className="text-center mt-4">
                <button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleSendOTP();
                    }} 
                    disabled={isLoading || disabled}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                    Resend Code
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneVerificationStep;





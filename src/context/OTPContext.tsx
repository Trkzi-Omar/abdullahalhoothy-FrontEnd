import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import apiRequest from '../services/apiRequest';
import urls from '../urls.json';
import {
  OTPChannel,
  OTPConfig,
  OTPContextType,
  OTPState,
  OTPStatus,
} from '../types/otp';

const DEFAULT_CODE_LENGTH = 6;
const DEFAULT_RESEND_COOLDOWN = 90; // 1 minute 30 seconds
const DEFAULT_MAX_RETRIES = 3;

const initialState: OTPState = {
  status: 'idle',
  phoneNumber: '',
  maskedPhone: '',
  errorMessage: null,
  resendCooldown: 0,
  retryCount: 0,
  maxRetries: DEFAULT_MAX_RETRIES,
  codeLength: DEFAULT_CODE_LENGTH,
};

const OTPContext = createContext<OTPContextType | undefined>(undefined);

// Helper function to mask phone number
const maskPhoneNumber = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  const visibleDigits = 4;
  const masked = phone.slice(0, -visibleDigits).replace(/./g, '*');
  return masked + phone.slice(-visibleDigits);
};

export const OTPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OTPState>(initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channel, setChannel] = useState<OTPChannel>('sms');
  
  // Callbacks refs to avoid stale closures
  const onSuccessRef = useRef<(() => void) | null>(null);
  const onCancelRef = useRef<(() => void) | null>(null);
  
  // Cooldown timer ref
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  // Start cooldown timer
  const startCooldownTimer = useCallback((seconds: number) => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
    }
    
    setState(prev => ({ ...prev, resendCooldown: seconds }));
    
    cooldownTimerRef.current = setInterval(() => {
      setState(prev => {
        const newCooldown = prev.resendCooldown - 1;
        if (newCooldown <= 0) {
          if (cooldownTimerRef.current) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return { ...prev, resendCooldown: 0 };
        }
        return { ...prev, resendCooldown: newCooldown };
      });
    }, 1000);
  }, []);

  // Reset state
  const resetState = useCallback(() => {
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
    setState(initialState);
    onSuccessRef.current = null;
    onCancelRef.current = null;
  }, []);

  // Send OTP
  const sendOTP = useCallback(async (phoneNumber: string, otpChannel: OTPChannel = 'sms'): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      status: 'sending' as OTPStatus,
      phoneNumber,
      maskedPhone: maskPhoneNumber(phoneNumber),
      errorMessage: null,
    }));
    setChannel(otpChannel);

    try {
      await apiRequest({
        url: urls.sms_send_otp,
        method: 'POST',
        body: {
          phone_number: phoneNumber,
          channel: otpChannel,
        },
      });

      setState(prev => ({
        ...prev,
        status: 'sent' as OTPStatus,
        retryCount: prev.retryCount + 1,
      }));
      
      startCooldownTimer(DEFAULT_RESEND_COOLDOWN);
      return true;
    } catch (error: any) {
      // Clear any existing timer on send failure
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = null;
      }
      
      const errorMessage = error?.message || 'Failed to send OTP. Please try again.';
      setState(prev => ({
        ...prev,
        status: 'error' as OTPStatus,
        errorMessage,
        resendCooldown: 0, // Reset cooldown on failure so user can retry immediately
      }));
      toast.error(errorMessage);
      return false;
    }
  }, [startCooldownTimer]);

  // Verify OTP
  const verifyOTP = useCallback(async (code: string): Promise<boolean> => {
    if (code.length !== state.codeLength) {
      setState(prev => ({
        ...prev,
        errorMessage: `Please enter a ${state.codeLength}-digit code`,
      }));
      return false;
    }

    setState(prev => ({
      ...prev,
      status: 'verifying' as OTPStatus,
      errorMessage: null,
    }));

    try {
      await apiRequest({
        url: urls.sms_verify_otp,
        method: 'POST',
        body: {
          phone_number: state.phoneNumber,
          code,
        },
      });

      setState(prev => ({
        ...prev,
        status: 'success' as OTPStatus,
      }));

      toast.success('Phone number verified successfully!');
      
      // Call success callback
      if (onSuccessRef.current) {
        onSuccessRef.current();
      }

      // Close modal after a brief delay
      setTimeout(() => {
        closeOTPModal();
      }, 1000);

      return true;
    } catch (error: any) {
      // Check for 404 (invalid code)
      const errorMessage = error?.response?.status === 404 
        ? 'Invalid verification code. Please try again.'
        : error?.message || 'Verification failed. Please try again.';
      
      setState(prev => ({
        ...prev,
        status: 'error' as OTPStatus,
        errorMessage,
      }));
      
      return false;
    }
  }, [state.codeLength, state.phoneNumber]);

  // Resend OTP
  const resendOTP = useCallback(async (): Promise<boolean> => {
    if (state.resendCooldown > 0) {
      toast.error(`Please wait ${state.resendCooldown} seconds before resending`);
      return false;
    }

    if (state.retryCount >= state.maxRetries) {
      const errorMessage = 'Maximum retry attempts reached. Please try again later.';
      setState(prev => ({
        ...prev,
        status: 'error' as OTPStatus,
        errorMessage,
      }));
      toast.error(errorMessage);
      return false;
    }

    return sendOTP(state.phoneNumber, channel);
  }, [state.resendCooldown, state.retryCount, state.maxRetries, state.phoneNumber, channel, sendOTP]);

  // Open OTP Modal
  const openOTPModal = useCallback((
    phoneNumber: string,
    onSuccess: () => void,
    onCancel?: () => void,
    config?: OTPConfig
  ) => {
    // Reset state first
    resetState();
    
    // Store callbacks
    onSuccessRef.current = onSuccess;
    onCancelRef.current = onCancel || null;
    
    // Apply config
    const codeLength = config?.codeLength || DEFAULT_CODE_LENGTH;
    const maxRetries = config?.maxRetries || DEFAULT_MAX_RETRIES;
    const otpChannel = config?.channel || 'sms';
    
    setState(prev => ({
      ...prev,
      phoneNumber,
      maskedPhone: maskPhoneNumber(phoneNumber),
      codeLength,
      maxRetries,
    }));
    
    setChannel(otpChannel);
    setIsModalOpen(true);
    
    // Automatically send OTP when modal opens
    sendOTP(phoneNumber, otpChannel);
  }, [resetState, sendOTP]);

  // Close OTP Modal
  const closeOTPModal = useCallback(() => {
    setIsModalOpen(false);
    
    // Call cancel callback if not successful
    if (state.status !== 'success' && onCancelRef.current) {
      onCancelRef.current();
    }
    
    // Reset state after modal closes
    setTimeout(() => {
      resetState();
    }, 300);
  }, [state.status, resetState]);

  const value: OTPContextType = {
    state,
    isModalOpen,
    sendOTP,
    verifyOTP,
    resendOTP,
    openOTPModal,
    closeOTPModal,
    resetState,
  };

  return <OTPContext.Provider value={value}>{children}</OTPContext.Provider>;
};

export const useOTP = (): OTPContextType => {
  const context = useContext(OTPContext);
  if (!context) {
    throw new Error('useOTP must be used within an OTPProvider');
  }
  return context;
};




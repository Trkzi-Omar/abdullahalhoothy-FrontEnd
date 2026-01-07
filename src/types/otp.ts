// OTP Types and Interfaces

export type OTPChannel = 'sms' | 'whatsapp';

export type OTPStatus = 'idle' | 'sending' | 'sent' | 'verifying' | 'success' | 'error';

export interface ReqSendOTP {
  phone_number: string;
  channel: OTPChannel;
}

export interface ReqVerifyOTP {
  phone_number: string;
  code: string;
}

export interface OTPConfig {
  codeLength?: number;
  resendCooldown?: number; // in seconds
  maxRetries?: number;
  channel?: OTPChannel;
}

export interface OTPState {
  status: OTPStatus;
  phoneNumber: string;
  maskedPhone: string;
  errorMessage: string | null;
  resendCooldown: number;
  retryCount: number;
  maxRetries: number;
  codeLength: number;
}

export interface OTPContextType {
  state: OTPState;
  isModalOpen: boolean;
  sendOTP: (phoneNumber: string, channel?: OTPChannel) => Promise<boolean>;
  verifyOTP: (code: string) => Promise<boolean>;
  resendOTP: () => Promise<boolean>;
  openOTPModal: (
    phoneNumber: string,
    onSuccess: () => void,
    onCancel?: () => void,
    config?: OTPConfig
  ) => void;
  closeOTPModal: () => void;
  resetState: () => void;
}

export interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  phoneNumber: string;
  config?: OTPConfig;
}




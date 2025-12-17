// src/components/Banner.tsx
import React from 'react';
import { IoClose } from 'react-icons/io5';


interface BannerProps {
  message: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
  visible: boolean;
  onClose?: () => void;
  className?: string;
  inline?: boolean; // NEW: allows positioning control
}

const Banner: React.FC<BannerProps> = ({
  message,
  type = 'info',
  visible,
  onClose,
  className = '',
  inline = false, // default to inline
}) => {
  if (!visible) return null;

  const colors = {
    info: 'bg-[#E0F2FE] text-[#0369A1]',       // light blue bg, dark blue text
    warning: 'bg-[#FEF3C7] text-[#B45309]',    // light yellow bg, dark yellow text
    success: 'bg-[#DCFCE7] text-[#166534]',    // light green bg, dark green text
    error: 'bg-[#FEE2E2] text-[#991B1B]',      // light red bg, dark red text
  };

  const containerClasses = inline
    ? `w-full ${colors[type]} py-2 px-4 flex justify-between items-center rounded-md shadow-sm ${className}`
    : `fixed top-0 left-0 right-0 ${colors[type]} py-3 px-4 flex justify-between items-center z-50 shadow-lg ${className}`

  return (
    <div className={containerClasses}>
      <div className="flex-1 text-center sm:text-left">
        <span className="text-sm sm:text-base">{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose} 
          className="ml-3 flex items-center justify-center w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex-shrink-0"
          aria-label="Close banner"
        >
          <IoClose size={16} color="white" />
        </button>
      )}
    </div>
  );
};

export default Banner;

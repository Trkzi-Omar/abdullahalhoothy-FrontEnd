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
    : `fixed top-4 left-1/2 -translate-x-1/2 ${colors[type]} py-3 px-4 flex justify-between items-center z-50 rounded-md shadow-md ${className}`

  return (
    <div className={containerClasses}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} 
      className="ml-3 flex items-center justify-center w-6 h-6 rounded bg-red-500 hover:bg-red-600 transition"        >
      <IoClose size={14} color="white" />
        </button>
      )}
    </div>
  );
};

export default Banner;

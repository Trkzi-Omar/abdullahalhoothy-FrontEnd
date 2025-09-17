import React from 'react';
import { BUTTON_BASE_CLASSES, TEXT_CLASSES, FONT_FAMILY, CampaignButtonProps } from './campaignCommon';

// Reusable button component
export const CampaignButton: React.FC<CampaignButtonProps> = ({
  onClick,
  children,
  className = '',
  fullWidth = true,
  onMouseEnter,
  onMouseLeave
}) => {
  const baseClasses = fullWidth ? `${BUTTON_BASE_CLASSES} w-full` : BUTTON_BASE_CLASSES;
  
  return (
    <div 
      onClick={onClick} 
      className={`${baseClasses} ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <p className={TEXT_CLASSES} style={{ fontFamily: FONT_FAMILY }}>
        {children}
      </p>
    </div>
  );
};

// Back button component
export const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-[#8E50EA] hover:bg-purple-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-colors"
    >
      ← Back
    </button>
  );
};
import React from 'react';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

/**
 * SelectableCard - Clean, clickable card component for report and option selection
 */
interface SelectableCardProps {
  title: string;
  description: string;
  onClick: () => void;
  icon?: React.ReactNode;
  badge?: string;
  recommended?: boolean;
  comingSoon?: boolean;
  bgImage?: string;
}

export const SelectableCard: React.FC<SelectableCardProps> = ({
  title,
  description,
  onClick,
  icon,
  badge,
  recommended = false,
  comingSoon = false,
  bgImage,
}) => {
  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      className={`
        relative w-full text-left p-6 rounded-xl border-2 transition-all duration-300
        ${
          comingSoon
            ? 'border-gray-300 bg-gray-100/60 cursor-not-allowed opacity-60'
            : recommended
              ? 'border-primary bg-primary hover:bg-green-800 hover:border-green-800 hover:shadow-xl hover:scale-[1.02]'
              : 'border-gray-200 bg-white hover:border-primary hover:shadow-xl hover:scale-[1.02]'
        }
        ${!comingSoon && ' cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20'}
        group
      `}
    >
      {/* Background Image with Low Opacity */}
      {bgImage && !recommended && (
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-0 transition-opacity duration-300 group-hover:opacity-10 rounded-xl overflow-hidden"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      )}
      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm z-10">
          Coming soon
        </div>
      )}

      {/* Badge */}
      {badge && !comingSoon && (
        <div className="pointer-events-none absolute -top-3 -right-3 bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          {badge}
        </div>
      )}

      {/* Icon */}
      {icon && (
        <div
          className={`pointer-events-none relative z-10 mb-4 flex items-center justify-center w-12 h-12 rounded-lg ${!comingSoon && 'group-hover:scale-110 group-hover:rotate-3'} transition-all duration-300 ${
            comingSoon
              ? 'bg-gray-200 text-gray-400'
              : recommended
                ? 'bg-white/20 text-white'
                : 'bg-primary/10 text-primary'
          }`}
        >
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="pointer-events-none relative z-10 space-y-2">
        <h3
          className={`text-lg font-bold flex items-center gap-2 ${
            comingSoon ? 'text-gray-700' : recommended ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
          {recommended && !comingSoon && <FaCheckCircle className="text-white text-sm" />}
        </h3>
        <p
          className={`text-sm leading-relaxed ${
            comingSoon ? 'text-gray-500' : recommended ? 'text-white/90' : 'text-gray-600'
          }`}
        >
          {description}
        </p>
      </div>

      {/* Hover indicator */}
      {!comingSoon && (
        <div
          className={`pointer-events-none relative z-10 mt-4 font-medium text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1 ${recommended ? 'text-white' : 'text-primary'}`}
        >
          Select this option
          <svg
            className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </button>
  );
};

/**
 * BackButton - Simple back navigation button
 */
interface BackButtonProps {
  onClick: () => void;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
    >
      <FaArrowLeft className="w-3 h-3" />
      Back
    </button>
  );
};

/**
 * LoadingState - Clean loading indicator
 */
interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
};

/**
 * ErrorState - Clean error display with retry
 */
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-gray-700 font-medium mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

/**
 * PageHeader - Clean page title and description
 */
interface PageHeaderProps {
  title: string;
  description?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="text-center mb-4">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{title}</h1>
      {description && <p className="text-gray-600 text-xs sm:text-sm">{description}</p>}
    </div>
  );
};

/**
 * HelpSection - Optional help text at bottom
 */
interface HelpSectionProps {
  children: React.ReactNode;
}

export const HelpSection: React.FC<HelpSectionProps> = ({ children }) => {
  return (
    <div className="mt-8 pt-6 border-t border-gray-200">
      <div className="bg-blue-50 rounded-lg p-4 text-center">
        <div className="text-sm text-gray-700">{children}</div>
      </div>
    </div>
  );
};

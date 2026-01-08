import React, { useRef, useEffect } from 'react';
import PhoneInputLib from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  className = '',
  inputClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inject custom styles to match the design
    const styleId = 'phone-input-custom-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const borderColor = error ? '#ef4444' : '#d1d5db';
    const borderWidth = error ? '2px' : '1px';
    const focusBorderColor = error ? '#ef4444' : '#3b82f6';
    const focusShadowColor = error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)';

    styleElement.textContent = `
      .phone-input-wrapper {
        width: 100%;
        position: relative;
        box-sizing: border-box;
        overflow: visible !important;
      }
      .phone-input-wrapper .react-tel-input {
        font-family: inherit;
        width: 100%;
        position: relative;
        box-sizing: border-box;
        overflow: visible !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown {
        box-sizing: border-box;
      }
      /* Ensure flag images are properly displayed - don't override library's sprite positioning */
      .phone-input-wrapper .react-tel-input .flag {
        display: inline-block !important;
        vertical-align: middle !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        border: none !important;
        border-right: none;
        border-radius: 0.375rem 0 0 0.375rem;
        background-color: transparent;
        transition: all 0.2s;
        z-index: 1;
        height: 100%;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown.open {
        border-color: ${focusBorderColor};
        z-index: 9999 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown.open .country-list {
        z-index: 9999 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown.open .selected-flag {
        background-color: white;
        border-radius: 0.375rem 0 0 0;
      }
      .phone-input-wrapper .react-tel-input .selected-flag {
        border-radius: 0.375rem 0 0 0.375rem;
        padding: 0 8px 0 12px;
        height: 100%;
        display: flex;
        align-items: center;
        background-color: white;
        cursor: pointer;
        min-width: 50px;
        border: none !important;
      }
      .phone-input-wrapper .react-tel-input .selected-flag:hover {
        background-color: white;
      }
      .phone-input-wrapper .react-tel-input .selected-flag:focus {
        background-color: white;
      }
      .phone-input-wrapper .react-tel-input .selected-flag .flag {
        margin-right: 6px;
        width: 20px;
        height: 15px;
        display: inline-block !important;
      }
      .phone-input-wrapper .react-tel-input .selected-flag .arrow {
        border-top-color: #6b7280;
        margin-left: 4px;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list {
        position: absolute !important;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        max-height: 300px;
        overflow-y: auto;
        overflow-x: hidden;
        margin-top: 4px;
        border: 1px solid #e5e7eb;
        background-color: white;
        width: 300px !important;
        min-width: 250px !important;
        padding: 4px 0;
        box-sizing: border-box !important;
        left: 0 !important;
        top: 100% !important;
        z-index: 9999 !important;
        display: block !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list::-webkit-scrollbar {
        width: 8px;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list::-webkit-scrollbar-track {
        background: #f9fafb;
        border-radius: 4px;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list::-webkit-scrollbar-thumb {
        background: #d1d5db;
        border-radius: 4px;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box {
        padding: 8px 12px;
        border-bottom: 1px solid #e5e7eb;
        margin-bottom: 4px;
        position: sticky;
        top: 0;
        background-color: white;
        color: black !important;
        z-index: 1;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input {
        width: 100%;
        padding: 8px 12px 8px 32px;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        color: #000000 !important;
        background-color: #f9fafb !important;
        transition: all 0.2s;
        -webkit-text-fill-color: #000000 !important;
        caret-color: #000000 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input:focus {
        outline: none;
        border-color: #3b82f6;
        background-color: white !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
        caret-color: #000000 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input[type="text"] {
        color: #000000 !important;
        -webkit-text-fill-color: #000000 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input:-webkit-autofill,
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input:-webkit-autofill:hover,
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input:-webkit-autofill:focus {
        -webkit-text-fill-color: #000000 !important;
        color: #000000 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input::placeholder {
        color: #6b7280 !important;
        opacity: 1 !important;
        font-weight: 400;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input::-webkit-input-placeholder {
        color: #6b7280 !important;
        opacity: 1 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input::-moz-placeholder {
        color: #6b7280 !important;
        opacity: 1 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input:-ms-input-placeholder {
        color: #6b7280 !important;
        opacity: 1 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input:-moz-placeholder {
        color: #6b7280 !important;
        opacity: 1 !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country {
        padding: 10px 16px;
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.15s ease;
        font-size: 0.875rem;
        color: #333333;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country .flag {
        margin-right: 10px;
        width: 20px;
        height: 15px;
        flex-shrink: 0;
        display: inline-block !important;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country .country-name {
        flex: 1;
        margin-right: 8px;
        font-weight: 400;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country .dial-code {
        color: #6b7280;
        font-size: 0.875rem;
        font-weight: 500;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country:hover {
        background-color: #f3f4f6;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country.highlight {
        background-color: #eff6ff;
        color: #1e40af;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country.highlight .dial-code {
        color: #1e40af;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country.preferred {
        background-color: #f0f9ff;
      }
      .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .divider {
        height: 1px;
        background-color: #e5e7eb;
        margin: 4px 0;
      }
      .phone-input-wrapper .react-tel-input input[type="tel"] {
        width: 100% !important;
        padding: 0.5rem 0.75rem !important;
        padding-left: 60px !important;
        border: ${borderWidth} solid ${borderColor} !important;
        border-radius: 0.375rem !important;
        font-size: 1rem !important;
        color: #333333 !important;
        background-color: white !important;
        transition: all 0.2s !important;
        height: auto !important;
        line-height: 1.5 !important;
        box-sizing: border-box !important;
        font-family: inherit !important;
      }
      .phone-input-wrapper .react-tel-input input[type="tel"]:focus {
        outline: none !important;
        border-color: ${focusBorderColor} !important;
        box-shadow: 0 0 0 3px ${focusShadowColor} !important;
      }
      .phone-input-wrapper .react-tel-input input[type="tel"]:disabled {
        background-color: #f3f4f6 !important;
        cursor: not-allowed !important;
        opacity: 0.6 !important;
      }
      .phone-input-wrapper .react-tel-input input[type="tel"]::placeholder {
        color: #9ca3af !important;
        opacity: 1 !important;
      }

      /* Responsive Styles */
      @media (max-width: 768px) {
        .phone-input-wrapper {
          width: 100%;
          position: relative;
        }
        .phone-input-wrapper .react-tel-input {
          position: relative;
          width: 100% !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          left: 0 !important;
          right: 0 !important;
          position: absolute !important;
          margin-top: 4px;
          max-height: 50vh;
          box-sizing: border-box !important;
          transform: translateX(0) !important;
        }
        .phone-input-wrapper .react-tel-input .selected-flag {
          min-width: 60px;
          padding: 0 6px 0 10px;
        }
        .phone-input-wrapper .react-tel-input .selected-flag .flag {
          width: 18px;
          height: 13px;
          margin-right: 4px;
        }
        .phone-input-wrapper .react-tel-input input[type="tel"] {
          padding-left: 70px !important;
          font-size: 16px !important; /* Prevents zoom on iOS */
          width: 100% !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country {
          padding: 12px 16px;
          min-height: 44px; /* Touch-friendly size */
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box {
          padding: 10px 12px;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input {
          padding: 10px 12px 10px 36px;
          font-size: 16px !important; /* Prevents zoom on iOS */
          min-height: 44px;
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          caret-color: #000000 !important;
          background-color: #f9fafb !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input:focus {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          caret-color: #000000 !important;
          background-color: white !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input::placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
      }

      @media (max-width: 640px) {
        .phone-input-wrapper {
          width: 100%;
          position: relative;
        }
        .phone-input-wrapper .react-tel-input {
          width: 100% !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          left: 0 !important;
          right: 0 !important;
          border-radius: 0.5rem;
          margin-top: 4px;
          max-height: 60vh;
          position: absolute !important;
          box-sizing: border-box !important;
          transform: translateX(0) !important;
        }
        .phone-input-wrapper .react-tel-input .selected-flag {
          min-width: 55px;
          padding: 0 4px 0 8px;
        }
        .phone-input-wrapper .react-tel-input input[type="tel"] {
          padding-left: 65px !important;
          width: 100% !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country {
          padding: 14px 12px;
          font-size: 0.9375rem;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country .flag {
          width: 18px;
          height: 13px;
          margin-right: 8px;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .country .dial-code {
          font-size: 0.8125rem;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          caret-color: #000000 !important;
        }
      }

      @media (max-width: 480px) {
        .phone-input-wrapper {
          width: 100%;
          position: relative;
        }
        .phone-input-wrapper .react-tel-input {
          width: 100% !important;
        }
        .phone-input-wrapper .react-tel-input .selected-flag {
          min-width: 50px;
          padding: 0 4px 0 8px;
        }
        .phone-input-wrapper .react-tel-input input[type="tel"] {
          padding-left: 60px !important;
          font-size: 16px !important;
          width: 100% !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list {
          max-height: 70vh;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          left: 0 !important;
          right: 0 !important;
          box-sizing: border-box !important;
          transform: translateX(0) !important;
        }
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list .search-box input {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          caret-color: #000000 !important;
        }
      }

      /* Landscape orientation adjustments */
      @media (max-width: 768px) and (orientation: landscape) {
        .phone-input-wrapper .react-tel-input .flag-dropdown .country-list {
          max-height: 40vh;
        }
      }
    `;

    return () => {
      // Don't remove style on cleanup to avoid flickering
    };
  }, [error]);

  const handleChange = (phoneValue: string) => {
    // Remove leading 0 if user enters number starting with 0
    // This is common in Saudi Arabia where users might enter 0558188632 instead of 558188632
    let cleanedValue = phoneValue;
    
    // Remove leading 0 for all countries (common mistake)
    // The library already handles country codes, so we just need to clean the local number part
    if (cleanedValue && cleanedValue.length > 0) {
      // Remove leading zeros from the phone number
      // This handles cases like 0558188632 -> 558188632
      cleanedValue = cleanedValue.replace(/^0+/, '');
    }
    
    // react-phone-input-2 returns value without + prefix
    onChange(cleanedValue);
  };

  // Strip + prefix if present (library expects value without +)
  // Also remove any leading 0 that might be in the stored value
  let phoneValue = value.startsWith('+') ? value.slice(1) : value;
  // Remove leading 0 if present (e.g., 0558188632 -> 558188632)
  if (phoneValue && phoneValue.startsWith('0') && phoneValue.length > 1) {
    phoneValue = phoneValue.replace(/^0+/, '');
  }

  // Determine default country based on value
  // Default to Saudi Arabia if value is empty
  // If value has content, let the library auto-detect the country
  const defaultCountry = (!phoneValue || phoneValue.trim() === '') ? "sa" : undefined;

  return (
    <div className={`phone-input-wrapper ${className}`} style={{ width: '100%', position: 'relative' }}>
      <div ref={containerRef} className="relative" style={{ width: '100%', position: 'relative' }}>
        <PhoneInputLib
          country={defaultCountry}
          value={phoneValue}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="55xxxxx"
          inputClass={inputClassName}
          containerClass="react-tel-input"
          buttonClass="flag-dropdown"
          dropdownClass="country-list"
          enableSearch
          searchPlaceholder="Search country"
          countryCodeEditable={false}
          specialLabel=""
          autoFormat={true}
          disableSearchIcon={false}
          preferredCountries={['sa', 'us', 'gb', 'ae']}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;


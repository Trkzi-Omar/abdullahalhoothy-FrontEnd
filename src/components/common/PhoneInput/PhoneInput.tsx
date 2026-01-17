import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  defaultCountries, 
  FlagImage, 
  parseCountry,
  usePhoneInput,
  CountryIso2
} from 'react-international-phone';
import 'react-international-phone/style.css';

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

interface CountryData {
  name: string;
  iso2: CountryIso2;
  dialCode: string;
  format?: string;
  priority?: number;
  areaCodes?: string[];
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
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preferred countries at the top
  const preferredCountryCodes: CountryIso2[] = ['sa', 'ae', 'us', 'gb'];

  // Parse countries data
  const countries: CountryData[] = useMemo(() => {
    return defaultCountries.map((country) => {
      const parsed = parseCountry(country);
      return {
        name: parsed.name,
        iso2: parsed.iso2,
        dialCode: parsed.dialCode,
        format: parsed.format,
        priority: parsed.priority,
        areaCodes: parsed.areaCodes,
      };
    });
  }, []);

  // Ensure value has proper format
  const normalizedValue = useMemo(() => {
    if (!value) return '';
    let cleaned = value.startsWith('+') ? value.slice(1) : value;
    // Remove leading zeros from the number part
    if (cleaned && cleaned.startsWith('0') && cleaned.length > 1) {
      cleaned = cleaned.replace(/^0+/, '');
    }
    return cleaned ? `+${cleaned}` : '';
  }, [value]);

  const { 
    inputValue, 
    handlePhoneValueChange, 
    inputRef, 
    country, 
    setCountry 
  } = usePhoneInput({
    defaultCountry: 'sa',
    value: normalizedValue,
    countries: defaultCountries,
    onChange: (data) => {
      // Remove + prefix and pass to parent
      const cleanValue = data.phone.startsWith('+') ? data.phone.slice(1) : data.phone;
      onChange(cleanValue);
    },
  });

  // Sorted countries with preferred ones at top
  const sortedCountries = useMemo(() => {
    const preferred = countries.filter(c => preferredCountryCodes.includes(c.iso2));
    const rest = countries.filter(c => !preferredCountryCodes.includes(c.iso2));
    // Sort preferred by their order in preferredCountryCodes
    preferred.sort((a, b) => 
      preferredCountryCodes.indexOf(a.iso2) - preferredCountryCodes.indexOf(b.iso2)
    );
    // Sort rest alphabetically
    rest.sort((a, b) => a.name.localeCompare(b.name));
    return { preferred, rest };
  }, [countries]);

  // Filtered countries based on search
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) {
      return sortedCountries;
    }
    const query = searchQuery.toLowerCase();
    const filterFn = (c: CountryData) => 
      c.name.toLowerCase().includes(query) || 
      c.dialCode.includes(query) ||
      c.iso2.toLowerCase().includes(query);
    
    return {
      preferred: sortedCountries.preferred.filter(filterFn),
      rest: sortedCountries.rest.filter(filterFn),
    };
  }, [searchQuery, sortedCountries]);

  // Get current country data
  const currentCountry = useMemo(() => {
    return countries.find(c => c.iso2 === country.iso2);
  }, [country.iso2, countries]);

  // Handle country selection
  const handleCountrySelect = useCallback((countryData: CountryData) => {
    setCountry(countryData.iso2);
    setIsOpen(false);
    setSearchQuery('');
    inputRef.current?.focus();
  }, [setCountry, inputRef]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, []);

  const borderColor = error ? 'border-red-500' : 'border-gray-300';
  const focusBorderColor = error ? 'focus-within:border-red-500' : 'focus-within:border-blue-500';
  const focusRingColor = error ? 'focus-within:ring-red-100' : 'focus-within:ring-blue-100';

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      <div 
        className={`
          flex items-center w-full bg-white rounded-lg border ${borderColor} 
          transition-all duration-200 ${focusBorderColor} ${focusRingColor}
          focus-within:ring-4 
          ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}
        `}
      >
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-3 py-2.5 border-r border-gray-200
            hover:bg-gray-50 transition-colors duration-150 rounded-l-lg
            focus:outline-none focus:bg-gray-50 min-w-[90px]
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label="Select country"
          aria-expanded={isOpen}
        >
          {currentCountry && (
            <>
              <FlagImage 
                iso2={currentCountry.iso2} 
                size="24px"
                className="rounded-sm shadow-sm"
              />
              <span className="text-gray-600 text-sm font-medium">
                +{currentCountry.dialCode}
              </span>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          value={inputValue}
          onChange={handlePhoneValueChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder="5xxxxxxxx"
          className={`
            flex-1 px-3 py-2.5 bg-transparent text-gray-800 placeholder-gray-400
            focus:outline-none text-base rounded-r-lg
            ${disabled ? 'cursor-not-allowed' : ''}
            ${inputClassName}
          `}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="
            absolute z-50 mt-2 w-full min-w-[280px] max-w-[360px] bg-white 
            rounded-xl shadow-2xl border border-gray-100 overflow-hidden
            animate-dropdown-in
          "
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries..."
                className="
                  w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 
                  rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 
                  focus:ring-blue-100 text-gray-800 placeholder-gray-400
                  transition-all duration-150
                "
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-[300px] overflow-y-auto overscroll-contain">
            {/* Preferred Countries */}
            {filteredCountries.preferred.length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  Popular
                </div>
                {filteredCountries.preferred.map((countryData) => (
                  <CountryOption
                    key={countryData.iso2}
                    country={countryData}
                    isSelected={country.iso2 === countryData.iso2}
                    onClick={() => handleCountrySelect(countryData)}
                  />
                ))}
                {filteredCountries.rest.length > 0 && (
                  <div className="h-px bg-gray-100 mx-3" />
                )}
              </>
            )}

            {/* All Countries */}
            {filteredCountries.rest.length > 0 && (
              <>
                {filteredCountries.preferred.length > 0 && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    All Countries
                  </div>
                )}
                {filteredCountries.rest.map((countryData) => (
                  <CountryOption
                    key={countryData.iso2}
                    country={countryData}
                    isSelected={country.iso2 === countryData.iso2}
                    onClick={() => handleCountrySelect(countryData)}
                  />
                ))}
              </>
            )}

            {/* No Results */}
            {filteredCountries.preferred.length === 0 && filteredCountries.rest.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No countries found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// Country Option Component
interface CountryOptionProps {
  country: CountryData;
  isSelected: boolean;
  onClick: () => void;
}

const CountryOption: React.FC<CountryOptionProps> = ({ country, isSelected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 text-left
        transition-colors duration-100 hover:bg-blue-50
        ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
      `}
    >
      <FlagImage 
        iso2={country.iso2} 
        size="22px"
        className="rounded-sm shadow-sm flex-shrink-0"
      />
      <span className="flex-1 text-sm font-medium truncate">
        {country.name}
      </span>
      <span className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
        +{country.dialCode}
      </span>
      {isSelected && (
        <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

export default PhoneInput;

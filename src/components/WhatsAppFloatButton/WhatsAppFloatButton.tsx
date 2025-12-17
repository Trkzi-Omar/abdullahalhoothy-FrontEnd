import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

interface WhatsAppFloatButtonProps {
  phoneNumber?: string;
  message?: string;
  position?: string;
  size?: string;
  colors?: string;
  className?: string;
}

const defaultProps: WhatsAppFloatButtonProps = {    
  phoneNumber: '966558188632',
  message: 'Hello! I\'m interested in learning more about S-Locator\'s location intelligence solutions for optimizing distribution routes and supply chain visibility.',
  position: 'fixed lg:bottom-6 lg:right-6',
  size: 'w-16 h-16',
  colors: 'bg-[#25D366]',
  className: '',
};


function WhatsAppFloatButton(props: WhatsAppFloatButtonProps = defaultProps) {
  const { phoneNumber, message, position, size, colors, className } = {
    ...defaultProps,
    ...props,
  };

  const [isVisible, setIsVisible] = useState(true);

  const handleClick = () => {
    const encodedMessage = message ? encodeURIComponent(message) : '';
    
    const whatsappUrl = `https://wa.me/${phoneNumber}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`${position} bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group`}
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <button
        onClick={handleClose}
        className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 
          rounded-full flex items-center justify-center shadow-lg
          transition-all duration-200
          z-10 border-2 border-white"
        aria-label="Hide WhatsApp button"
        title="Hide WhatsApp button"
      >
        <IoClose className="text-white w-4 h-4" />
      </button>

      <button
        onClick={handleClick}
        className={`${colors} ${size}
          rounded-full shadow-xl flex items-center justify-center 
          transition-all duration-300 hover:scale-110 ease-in-out 
          hover:brightness-110 hover:shadow-2xl ${className}`}
        aria-label="Contact us on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <FaWhatsapp className="text-white w-8 h-8" />
      </button>
    </div>
  );
}

export default WhatsAppFloatButton;

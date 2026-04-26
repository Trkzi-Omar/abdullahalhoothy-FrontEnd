import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { handleWhatsAppClick } from '../../utils/helperFunctions';
import { t } from '../../i18n';


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
  message:t("hello-i-m-interested-in-learning-more-about-s-locator-s-location-intelligence-so"),
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

  if (!isVisible) return null;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

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
        aria-label={t("hide-whatsapp-button")}
        title={t("hide-whatsapp-button")}
      >
        <IoClose className="text-white w-4 h-4" />
      </button>

      <button
        onClick={() =>
          handleWhatsAppClick({
            phoneNumber,
            message,
          })
        }
        className={`${colors} ${size}
          rounded-full shadow-xl flex items-center justify-center 
          transition-all duration-300 hover:scale-110 ease-in-out 
          hover:brightness-110 hover:shadow-2xl ${className}`}
        aria-label={t("contact-us-on-whatsapp")}
        title={t("chat-with-us-on-whatsapp")}
      >
        <FaWhatsapp className="text-white w-8 h-8" />
      </button>
    </div>
  );
}

export default WhatsAppFloatButton;

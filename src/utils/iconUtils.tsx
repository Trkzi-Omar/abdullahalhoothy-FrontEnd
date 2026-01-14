import React from 'react';
import * as FaIcons from 'react-icons/fa';
import * as Io5Icons from 'react-icons/io5';
import * as GrIcons from 'react-icons/gr';
import * as AiIcons from 'react-icons/ai';
import * as BsIcons from 'react-icons/bs';
import * as MdIcons from 'react-icons/md';

const iconLibraries: { [key: string]: any } = {
  fa: FaIcons,
  io5: Io5Icons,
  gr: GrIcons,
  ai: AiIcons,
  bs: BsIcons,
  md: MdIcons,
};

interface DynamicIconProps {
  iconString?: string;
  fallbackIcon?: React.ComponentType<any>;
  className?: string;
}

/**
 * Dynamically renders an icon from react-icons based on a string format.
 *
 * @param iconString - Format: "library/IconName" (e.g., "fa/FaStore", "io5/IoRestaurant")
 * @param fallbackIcon - Fallback icon component if iconString is invalid or not found
 * @param className - CSS classes to apply to the icon
 *
 * @example
 * <DynamicIcon iconString="fa/FaStore" fallbackIcon={FaMapMarkedAlt} className="w-6 h-6" />
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({
  iconString,
  fallbackIcon: FallbackIcon = FaIcons.FaMapMarkedAlt,
  className = "w-6 h-6"
}) => {
  if (!iconString) {
    return <FallbackIcon className={className} />;
  }

  try {
    const [library, iconName] = iconString.split('/');

    if (!library || !iconName) {
      console.warn(`Invalid icon string format: ${iconString}`);
      return <FallbackIcon className={className} />;
    }

    const iconLib = iconLibraries[library.toLowerCase()];

    if (!iconLib) {
      console.warn(`Icon library not found: ${library}`);
      return <FallbackIcon className={className} />;
    }

    const IconComponent = iconLib[iconName];

    if (!IconComponent) {
      console.warn(`Icon not found: ${iconName} in library ${library}`);
      return <FallbackIcon className={className} />;
    }

    return <IconComponent className={className} />;
  } catch (error) {
    console.error('Error rendering dynamic icon:', error);
    return <FallbackIcon className={className} />;
  }
};

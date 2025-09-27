import {
  FaCar,
  FaUsers,
  FaStore,
  FaHospital,
  FaHandshake,
  FaChartBar,
  FaWalking,
  FaWheelchair,
  FaUtensils,
  FaCoffee,
  FaShoppingBag,
} from 'react-icons/fa';
import { MetricKey } from '../../types/allTypesAndInterfaces';

// Business type specific icon strategies
const iconStrategies: Record<string, Record<string, () => JSX.Element>> = {
  pharmacy: {
    traffic: () => <FaCar className="w-4 h-4" />,
    demographics: () => <FaUsers className="w-4 h-4" />,
    competition: () => <FaStore className="w-4 h-4" />,
    healthcare: () => <FaHospital className="w-4 h-4" />,
    complementary: () => <FaHandshake className="w-4 h-4" />,
  },
  cafe: {
    traffic: () => <FaCar className="w-4 h-4" />,
    demographics: () => <FaUsers className="w-4 h-4" />,
    competition: () => <FaStore className="w-4 h-4" />,
    footfall: () => <FaWalking className="w-4 h-4" />,
    complementary: () => <FaCoffee className="w-4 h-4" />,
  },
  retail: {
    traffic: () => <FaCar className="w-4 h-4" />,
    demographics: () => <FaUsers className="w-4 h-4" />,
    competition: () => <FaStore className="w-4 h-4" />,
    accessibility: () => <FaWheelchair className="w-4 h-4" />,
    complementary: () => <FaShoppingBag className="w-4 h-4" />,
  },
  restaurant: {
    traffic: () => <FaCar className="w-4 h-4" />,
    demographics: () => <FaUsers className="w-4 h-4" />,
    competition: () => <FaStore className="w-4 h-4" />,
    footfall: () => <FaWalking className="w-4 h-4" />,
    complementary: () => <FaUtensils className="w-4 h-4" />,
  },
};

export const getMetricIcon = (
  metric: string,
  businessType: string = 'pharmacy',
  businessConfig?: any
): JSX.Element => {
  // If we have business config with metric icons, use those
  if (businessConfig?.metrics?.[metric]?.icon) {
    return <span className="w-4 h-4 text-center">{businessConfig.metrics[metric].icon}</span>;
  }

  // Fallback to hardcoded icons
  const businessStrategies = iconStrategies[businessType] || iconStrategies.pharmacy;
  const strategy = businessStrategies[metric];
  return strategy ? strategy() : <FaChartBar className="w-4 h-4" />;
};

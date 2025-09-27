import { FaCar, FaUsers, FaStore, FaHospital, FaHandshake, FaChartBar } from 'react-icons/fa';
import { MetricKey } from '../types';

// Strategy pattern for metric icons
const iconStrategies: Record<MetricKey, () => JSX.Element> = {
  traffic: () => <FaCar className="w-4 h-4" />,
  demographics: () => <FaUsers className="w-4 h-4" />,
  competition: () => <FaStore className="w-4 h-4" />,
  healthcare: () => <FaHospital className="w-4 h-4" />,
  complementary: () => <FaHandshake className="w-4 h-4" />,
};

export const getMetricIcon = (metric: string): JSX.Element => {
  const strategy = iconStrategies[metric as MetricKey];
  return strategy ? strategy() : <FaChartBar className="w-4 h-4" />;
};

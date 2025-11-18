import { BillingProvider } from '../../context/BillingContext';
import BillingLayout from './BillingLayout';

export const BillingContentWrapper = () => {
  return (
    <BillingProvider>
      <BillingLayout />
    </BillingProvider>
  );
};


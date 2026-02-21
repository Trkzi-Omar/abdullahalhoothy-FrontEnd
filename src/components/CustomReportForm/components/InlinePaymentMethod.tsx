import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import React, { useState, FormEvent, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import apiRequest from '../../../services/apiRequest';
import urls from '../../../urls.json';
import { useOTP } from '../../../context/OTPContext';
import { toast } from 'sonner';

interface InlinePaymentMethodProps {
  onPaymentMethodAdded: () => void;
  onCancel?: () => void;
  userPhone: string | null;
}

const InlinePaymentMethod: React.FC<InlinePaymentMethodProps> = ({
  onPaymentMethodAdded,
  onCancel,
  userPhone,
}) => {
  const { authResponse } = useAuth();
  const { openOTPModal } = useOTP();
  const stripe = useStripe();
  const elements = useElements();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cardBrand, setCardBrand] = useState<string>('unknown');
  const [cardNumberError, setCardNumberError] = useState<string | null>(null);
  const [cardExpiryError, setCardExpiryError] = useState<string | null>(null);
  const [cardCvcError, setCardCvcError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cardholderName, setCardholderName] = useState('');

  const handleCardChange = (event: any) => {
    setCardBrand(event.brand);
    setCardNumberError(event.error ? event.error.message : null);
  };

  const handleCardNumberChange = (event: any) => {
    setCardNumberError(event.error ? event.error.message : null);
  };

  const handleCardExpiryChange = (event: any) => {
    setCardExpiryError(event.error ? event.error.message : null);
  };

  const handleCardCvcChange = (event: any) => {
    setCardCvcError(event.error ? event.error.message : null);
  };

  const cardBrands: Record<string, string> = {
    visa: '/card-brands/visa.svg',
    mastercard: '/card-brands/mastercard.svg',
    amex: '/card-brands/amex.svg',
    discover: '/card-brands/discover.svg',
    unknown: '/card-brands/credit-card.svg',
  };

  const savePaymentMethod = useCallback(async () => {
    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded correctly.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      setErrorMessage('One or more card fields are not loaded.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumberElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (stripeError) {
        setErrorMessage(
          stripeError.message || 'Failed to create the payment method. Please try again.'
        );
        setSubmitting(false);
        return;
      }

      if (!paymentMethod) {
        setErrorMessage('No payment method was created.');
        setSubmitting(false);
        return;
      }

      const paymentMethodId = paymentMethod.id;

      await apiRequest({
        url: urls.attach_stripe_payment_method,
        method: 'POST',
        body: {
          payment_method_id: paymentMethodId,
          user_id: authResponse?.localId,
        },
        isAuthRequest: true,
      });

      if (authResponse?.localId) {
        await apiRequest({
          url: `${urls.set_default_stripe_payment_method}?user_id=${authResponse.localId}&payment_method_id=${paymentMethodId}`,
          method: 'PUT',
          isAuthRequest: true,
        });
      }

      toast.success('Payment method added successfully!');
      onPaymentMethodAdded();
    } catch (error) {
      console.error('Payment method error:', error);
      setErrorMessage('An unexpected error occurred. Please try again later.');
      setSubmitting(false);
    }
  }, [stripe, elements, cardholderName, authResponse, onPaymentMethodAdded]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Stripe has not loaded correctly.');
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
      setErrorMessage('One or more card fields are not loaded.');
      return;
    }

    if (!userPhone) {
      toast.error('Please add a phone number to your profile before adding a payment method.');
      return;
    }

    // Trigger OTP verification before saving payment method
    openOTPModal(
      userPhone,
      () => {
        // On successful OTP verification, save the payment method
        savePaymentMethod();
      },
      () => {
        // On cancel
        toast.info('Payment method addition cancelled.');
      }
    );
  };

  const elementStyles = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '16px',
        '::placeholder': {
          color: '#a0a0a0',
        },
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Add Payment Method</h3>
        <p className="text-sm text-gray-600">
          To continue with your report, please add a payment method.
        </p>
      </div>

      {!userPhone && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          ⚠️ A verified phone number is required to add a payment method. Please add a phone number
          to your profile first.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cardholder-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name on card
          </label>
          <input
            id="cardholder-name"
            type="text"
            value={cardholderName}
            onChange={e => setCardholderName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Name on card"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card number</label>
          <div className="relative">
            <CardNumberElement
              options={elementStyles}
              onChange={handleCardChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {cardBrand && (
              <img
                src={cardBrands[cardBrand] || '/card-brands/credit-card.svg'}
                alt={cardBrand}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                width={24}
                height={24}
              />
            )}
          </div>
          {cardNumberError && <p className="text-red-500 text-sm mt-1">{cardNumberError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
            <CardExpiryElement
              options={elementStyles}
              onChange={handleCardExpiryChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {cardExpiryError && <p className="text-red-500 text-sm mt-1">{cardExpiryError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
            <CardCvcElement
              options={elementStyles}
              onChange={handleCardCvcChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {cardCvcError && <p className="text-red-500 text-sm mt-1">{cardCvcError}</p>}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || !elements || submitting || !userPhone}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {submitting ? 'Adding...' : 'Add Payment Method'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InlinePaymentMethod;










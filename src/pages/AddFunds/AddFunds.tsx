import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import apiRequest from '../../services/apiRequest';
import urls from '../../urls.json';

const AddFundsForm: React.FC = () => {
  const { authResponse } = useAuth();
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // State for individual card field errors
  const [submitting, setSubmitting] = useState(false);
  const [cost, setCost] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Format the cost to display with .00 for whole numbers
  const formatCost = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      return num.toFixed(2);
    }
    return value;
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setCost(value);
      setInputError(null);
    } else {
      setInputError('Enter a valid amount (e.g. 10.99)');
    }
  };

  const handleCostFocus = () => {
    const num = parseFloat(cost);
    if (!isNaN(num)) {
      setCost(String(num));
    }
    setInputError(null);
  };

  const handleCostBlur = () => {
    if (cost && !isNaN(parseFloat(cost))) {
      setCost(formatCost(cost));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Check for input validation errors
    if (inputError) {
      setErrorMessage('Please fix the input errors before submitting.');
      return;
    }
    
    // Clear previous errors and set loading state
    setErrorMessage(null);
    setSubmitting(true);

    try {
      const amount = parseFloat(cost);
      if (isNaN(amount) || amount <= 0) {
        setErrorMessage('Please enter a valid amount.');
        setSubmitting(false);
        return;
      }

      if (!authResponse?.localId) {
        setErrorMessage('User not authenticated.');
        setSubmitting(false);
        return;
      }

      await apiRequest({
        url: urls.top_up_wallet,
        method: 'POST',
        body: {
          amount: amount * 100, //multiply by 100 to convert dollars to cents
          user_id: authResponse.localId,
        },
        isAuthRequest: true,
      });

      navigate('/profile/wallet');
    } catch (error) {
      console.log(error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.');
      setInputError(null); // Clear input error on API error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex items-center ">
      <div className="my-8 border w-full max-w-3xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">Add Funds</h1>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-4">
          <div className="space-y-4">
            <div>
              <input
                id="cardholder-name"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={cost}
                onChange={handleCostChange}
                onFocus={handleCostFocus}
                onBlur={handleCostBlur}
                className="w-full p-3 border border-gray-200 shadow-sm rounded-md focus:outline-none"
                placeholder="0.00"
                required
              />
              {inputError && <p className="text-red-500 text-sm mt-1">{inputError}</p>}
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait transition duration-200 ease-in-out flex items-center justify-center"
            >
              Topup
            </button>
          </div>
        </form>
        {errorMessage && (
          <div className="px-6 py-4 bg-red-50 border-t border-red-200">
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AddFunds: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

  return (
    <>
      <AddFundsForm />
    </>
  );
};

export default AddFunds;

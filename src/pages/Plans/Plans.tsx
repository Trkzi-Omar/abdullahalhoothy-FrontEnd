import React, { useEffect, useState } from 'react';
import urls from '../../urls.json';
import { useNavigate } from 'react-router';
import apiRequest from '../../services/apiRequest';

type Feature = {
  included: boolean;
  text: string;
  subtext?: string;
  meta?: string;
};

type AI = {
  tier: string;
  subfeatures: string[];
};

type Plan = {
  id: number;
  name: string;
  price: string;
  tagline?: string;
  recommended?: boolean;
  features: Feature[];
  ai: AI;
};

const PlansPage: React.FC = () => {
  const [plansData, setPlansData] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [users, setUsers] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await apiRequest({
          url: urls.fetch_plans,
          method: 'get',
          isAuthRequest: false,
        });
        // Handle both direct data and nested data.data structure
        const plans = res?.data?.data || res?.data || res || [];
        setPlansData(Array.isArray(plans) ? plans : []);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
        setError('Failed to load plans. Please try again later.');
        setPlansData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const decreaseUsers = () => {
    if (users > 1) setUsers(users - 1);
  };

  const increaseUsers = () => {
    setUsers(users + 1);
  };

  const handleClick = () => {
    navigate('/sign-up');
  };

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center px-6 py-3 bg-gray-50 min-h-screen">
        <div className="text-lg text-gray-600">Loading plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center px-6 py-3 bg-gray-50 min-h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center px-6 py-3 bg-gray-50">
      {/* Top controls */}
      <div className="w-full bg-white border border-gray-200 max-w-4xl p-3 flex flex-col md:flex-row items-start gap-6">
        {/* Billing toggle */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Billing:</span>
          <div className="bg-gray-100 p-1 flex">
            <button
              onClick={() => setBillingCycle('month')}
              className={`px-6 py-1.5 text-sm font-medium transition ${
                billingCycle === 'month'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('year')}
              className={`px-6 py-1.5 text-sm font-medium transition ${
                billingCycle === 'year'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* User counter */}
        <div className="flex items-center gap-3">
          <label htmlFor="users" className="text-sm font-medium text-gray-700">
            Users
          </label>

          <div className="flex h-9 w-28 items-stretch overflow-hidden border border-gray-300 bg-white shadow-sm">
            <input
              id="users"
              type="number"
              inputMode="numeric"
              value={users}
              onChange={e => setUsers(Number(e.target.value))}
              // Hide native spinners so we don't get duplicates
              className="w-full flex-1 px-3 text-center text-sm text-gray-900 focus:outline-none
                 [&::-webkit-outer-spin-button]:appearance-none
                 [&::-webkit-inner-spin-button]:appearance-none
                 [appearance:textfield]"
              onKeyDown={e => {
                if (e.key === 'ArrowUp') {
                  increaseUsers();
                  e.preventDefault();
                }
                if (e.key === 'ArrowDown') {
                  decreaseUsers();
                  e.preventDefault();
                }
              }}
            />

            {/* Always-visible custom stepper */}
            <div className="flex w-8 flex-col border-l border-gray-200">
              <button
                type="button"
                onClick={increaseUsers}
                className="grid flex-1 place-items-center hover:bg-gray-50 active:bg-gray-100 focus:outline-none"
                aria-label="Increase users"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 14l6-6 6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={decreaseUsers}
                className="grid flex-1 place-items-center border-t border-gray-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none"
                aria-label="Decrease users"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M18 10l-6 6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 w-full max-w-4xl">
        {plansData.map((plan: Plan) => {
          const included = plan.features.filter(f => f.included);
          const excluded = plan.features.filter(f => !f.included);

          return (
            <div
              key={plan.id}
              className={`relative bg-white shadow-md p-6 flex flex-col border ${
                plan.recommended ? 'border-2 border-purple-600' : 'border-gray-200'
              }`}
            >
              {plan.recommended && (
                <span className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-semibold px-3 py-1">
                  RECOMMENDED
                </span>
              )}

              {/* Plan name + tagline */}
              <h2 className="text-xl font-semibold text-gray-800 mb-1">{plan.name}</h2>
              {plan.tagline && <p className="text-sm text-gray-500 mb-3">{plan.tagline}</p>}

              {/* Price */}
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {plan.price}
                <span className="text-sm font-medium text-gray-500 ml-1">
                  / {billingCycle} / {users} user{users > 1 ? 's' : ''}
                </span>
              </p>

              {/* CTA button */}
              <button
                onClick={handleClick}
                className={`my-4 w-full py-2 rounded-md font-semibold transition ${
                  plan.recommended
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-white text-purple-600 border border-purple-600 hover:bg-purple-50'
                }`}
              >
                Get Started
              </button>

              {/* Included features */}
              <div className="space-y-3">
                {included.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {/* Checkmark lighter like Slack */}
                    {/* Check icon (thin stroke) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8E50EA" // purple check color
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4 flex-shrink-0"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                    <div className="flex w-full flex-col">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-sm text-gray-800">{feature.text}</span>
                        {feature.meta && (
                          <div className="relative group">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 text-gray-400 cursor-pointer"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1}
                            >
                              <circle cx="12" cy="12" r="9.5" stroke="currentColor" />
                              <circle cx="12" cy="8" r="0.6" fill="currentColor" />
                              <line
                                x1="12"
                                y1="11"
                                x2="12"
                                y2="16"
                                stroke="currentColor"
                                strokeLinecap="round"
                              />
                            </svg>

                            <div className="absolute left-5 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                              {feature.meta}
                            </div>
                          </div>
                        )}
                      </div>
                      {feature.subtext && (
                        <span className="text-xs text-gray-500">{feature.subtext}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Section */}
              <div className="mt-6 mb-6 rounded-md bg-purple-50 p-4">
                <h4
                  className={`flex items-center gap-2 font-semibold mb-2 ${
                    plan.ai.tier.includes('Advanced') ? 'text-purple-700' : 'text-purple-600'
                  }`}
                >
                  {/* Custom sparkle icon */}
                  <svg
                    className="w-5 h-5"
                    width="20"
                    height="20"
                    fill="#730394"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="m13.1413 10.4214-2.4057 1.2003c-.7228.3612-1.30734.9455-1.66873 1.6678l-1.20106 2.4043c-.17006.3435-.66253.3435-.83259 0l-1.20107-2.4043c-.36138-.7223-.94597-1.3066-1.66873-1.6678l-2.40567-1.2003c-.34367-.17-.34367-.66218 0-.83215l2.40567-1.20037c.72276-.36118 1.30735-.94543 1.66873-1.66778l1.20107-2.40429c.17006-.34347.66253-.34347.83259 0l1.20106 2.40429c.36139.72235.94593 1.3066 1.66873 1.66778l2.4057 1.20037c.3436.16997.3436.66215 0 .83215zm5.2471 5.3468-1.031-.517c-.3118-.1523-.5598-.4072-.7157-.7153l-.5173-1.0304c-.0708-.1487-.2834-.1487-.3578 0l-.5173 1.0304c-.1523.3116-.4074.5595-.7156.7153l-1.031.517c-.1488.0708-.1488.2832 0 .3576l1.031.517c.3117.1522.5597.4072.7156.7153l.5173 1.0304c.0709.1487.2834.1487.3578 0l.5173-1.0304c.1524-.3117.4075-.5595.7157-.7153l1.031-.517c.1488-.0708.1488-.2833 0-.3576zm0-11.89401-1.031-.51697c-.3118-.15226-.5598-.40721-.7157-.71527l-.5173-1.03041c-.0708-.14872-.2834-.14872-.3578 0l-.5173 1.03041c-.1523.3116-.4074.55947-.7156.71527l-1.031.51697c-.1488.07082-.1488.28328 0 .35764l1.031.51697c.3117.15226.5597.40721.7156.71527l.5173 1.03041c.0709.14872.2834.14872.3578 0l.5173-1.03041c.1524-.3116.4075-.55947.7157-.71527l1.031-.51697c.1488-.07082.1488-.28328 0-.35764z" />
                  </svg>
                  {plan.ai.tier}
                </h4>
                <ul className="space-y-1">
                  {plan.ai.subfeatures.map((sub, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      {/* Check icon (thin stroke) */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8E50EA" // purple check color
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="w-4 h-4 flex-shrink-0"
                      >
                        <path d="M5 12l5 5L20 7" />
                      </svg>{' '}
                      {sub}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Excluded features */}
              <div className="space-y-3">
                {excluded.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-gray-400">
                    <span className="text-sm">—</span>
                    <div className="flex w-full flex-col">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-sm">{feature.text}</span>
                        {feature.meta && (
                          <div className="relative group">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-4 h-4 text-gray-400 cursor-pointer"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1}
                            >
                              <circle cx="12" cy="12" r="9.5" stroke="currentColor" />
                              <circle cx="12" cy="8" r="0.6" fill="currentColor" />
                              <line
                                x1="12"
                                y1="11"
                                x2="12"
                                y2="16"
                                stroke="currentColor"
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                              {feature.meta}
                            </div>
                          </div>
                        )}
                      </div>
                      {feature.subtext && <span className="text-xs">{feature.subtext}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlansPage;

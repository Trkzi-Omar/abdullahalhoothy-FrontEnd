import React, { useEffect, useState } from 'react';
import urls from '../../urls.json';

type Feature = {
  included: boolean;
  text: string;
  subtext?: string;
  meta?: string;
};

type Plan = {
  id: number;
  name: string;
  price: string;
  features: Feature[];
};

const PlansPage: React.FC = () => {
  const [plansData, setPlansData] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [users, setUsers] = useState<number>(1);

  useEffect(() => {
    fetch(`${urls.REACT_APP_API_URL + urls.fetch_plans}`)
      .then(res => res.json())
      .then(data => {
        setPlansData(data);
      })
      .catch(err => console.error('Failed to fetch plans:', err));
  }, []);

  const decreaseUsers = () => {
    if (users > 1) setUsers(users - 1);
  };

  const increaseUsers = () => {
    setUsers(users + 1);
  };

  return (
    <div className="w-full flex flex-col items-center px-6 py-12 bg-gray-50">
      {/* Top controls */}
      <div className=" grid">
        {/* Top controls */}
        <div className="flex flex-col md:flex-row items-start justify-start w-full max-w-5xl mb-10 gap-6">
          {/* Billing toggle */}
          <div className="bg-gray-200 rounded-full p-1 flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'monthly'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                billingCycle === 'annual'
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Annual
            </button>
          </div>

          {/* User counter */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Users:</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={decreaseUsers}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                −
              </button>
              <span className="px-4 py-1 text-gray-800 text-sm font-medium">{users}</span>
              <button
                onClick={increaseUsers}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="h-full grid gap-8 md:grid-cols-3">
        {plansData.map((plan: Plan) => (
          <div key={plan.id} className="bg-white w-[25vw] shadow-md rounded-2xl p-6 flex flex-col">
            {/* Plan name + price centered */}
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">{plan.name}</h2>
            <p className="text-lg font-medium text-gray-600 mb-1 text-center">
              ${plan.price}{' '}
              <span className="text-sm text-gray-400">
                / {billingCycle} / {users} user{users > 1 ? 's' : ''}
              </span>
            </p>

            {/* CTA button */}
            <button className="my-2 w-full bg-[#8E50EA] text-white py-2 rounded-xl hover:bg-[#753ecb] transition">
              Get Started
            </button>

            {/* Features */}
            <div className="flex-1 space-y-4">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 relative">
                  {/* Check/Dash + text */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`text-lg mt-0.5 ${
                        feature.included ? 'text-[#8E50EA]' : 'text-gray-400'
                      }`}
                    >
                      {feature.included ? '✔' : '—'}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">{feature.text}</span>
                      {feature.subtext && (
                        <span className="text-xs text-gray-500">{feature.subtext}</span>
                      )}
                    </div>
                  </div>

                  {/* Info icon with tooltip */}
                  {feature.meta && (
                    <div className="group relative">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full border border-gray-400 text-gray-500 text-[10px] font-bold cursor-pointer hover:bg-gray-100">
                        i
                      </span>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-md px-2 py-1 w-48 shadow-lg z-10">
                        {feature.meta}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansPage;

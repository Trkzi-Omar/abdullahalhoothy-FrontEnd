import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(1);
  const [reportCount, setReportCount] = useState<number>(10);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/plan-details')
      .then(res => res.json())
      .then(data => {
        setPlans(data);
        if (data.packages?.sliders) {
          setUserCount(data.packages.sliders.users.min);
          setReportCount(data.packages.sliders.reports.min);
        }
      })
      .catch(err => console.error('Failed to fetch plans:', err));
  }, []);

  if (!plans) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-medium text-purple-700">
        Loading...
      </div>
    );
  }

  const totalDiscount =
    plans.packages.initial_discount + userCount * plans.packages.sliders.users.discount_per_user;

  const userPrice =
    userCount * plans.packages.sliders.users.base_price_per_user * (1 - totalDiscount);
  const reportPrice =
    reportCount *
    plans.packages.sliders.reports.base_price_per_report *
    (1 - plans.packages.sliders.reports.discount_per_report);

  const finalPrice = (userPrice + reportPrice).toFixed(2);

  const Card = ({
    title,
    children,
    className = '',
  }: {
    title: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={`bg-white rounded-2xl shadow-md p-6 flex flex-col border border-gray-100 hover:shadow-xl transition duration-200 ${className}`}
    >
      <h2 className="text-2xl font-semibold text-purple-700 mb-4">{title}</h2>
      {children}
    </div>
  );

  const PrimaryButton = ({
    onClick,
    href,
    children,
  }: {
    onClick?: () => void;
    href?: string;
    children: React.ReactNode;
  }) => {
    const handleClick = () => {
      if (href) {
        window.location.href = href;
      } else if (onClick) {
        onClick();
      }
    };

    return (
      <button
        onClick={handleClick}
        className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200"
      >
        {children}
      </button>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title={plans.pay_as_you_go.title} className="md:col-span-1">
        <ul className="mb-4 list-disc pl-5 text-gray-700 space-y-1">
          {plans.pay_as_you_go.features.map((f: string, idx: number) => (
            <li key={idx}>{f}</li>
          ))}
        </ul>
        <p className="text-lg font-semibold text-gray-900">
          ${plans.pay_as_you_go.price_per_report}{' '}
          <span className="text-sm font-normal text-gray-500">per report</span>
        </p>
      </Card>

      <Card title={plans.packages.title} className="md:col-span-2">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-gray-800">Users: {userCount}</span>
            <span className="text-sm text-purple-600">
              ${plans.packages.sliders.users.base_price_per_user}/user
            </span>
          </div>
          <input
            type="range"
            min={plans.packages.sliders.users.min}
            max={plans.packages.sliders.users.max}
            step={plans.packages.sliders.users.step}
            value={userCount}
            onChange={e => setUserCount(Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-gray-800">Reports: {reportCount}</span>
            <span className="text-sm text-purple-600">
              ${plans.packages.sliders.reports.base_price_per_report}/report
            </span>
          </div>
          <input
            type="range"
            min={plans.packages.sliders.reports.min}
            max={plans.packages.sliders.reports.max}
            step={plans.packages.sliders.reports.step}
            value={reportCount}
            onChange={e => setReportCount(Number(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer"
          />
        </div>

        <p className="text-lg">Discount: {(totalDiscount * 100).toFixed(1)}%</p>
        <p className="text-xl font-bold text-gray-900 mb-2">
          Total: <span className="text-purple-700">${finalPrice}</span>
        </p>
      </Card>

      <Card title={plans.enterprise.title} className="md:col-span-2">
        <p className="mb-4 text-gray-700">Custom solutions for your organization.</p>
        <PrimaryButton onClick={() => navigate(plans.enterprise.redirect_url)}>
          Contact Us
        </PrimaryButton>
      </Card>

      <Card title={plans.signup.title} className="md:col-span-1">
        <p className="mb-4 text-gray-700">Create your account and get started today.</p>
        <PrimaryButton href={plans.signup.redirect_url}>Sign Up</PrimaryButton>
      </Card>
    </div>
  );
};

export default PlansPage;

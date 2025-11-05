import React from 'react';
import { useSignUp } from '../../../context/SignUpContext';

const FirstPage: React.FC = () => {
  const { formData, errors, countries, handleInputChange } = useSignUp();

  return (
    <>
      <div>
        <p className="font-bold text-gray-100">Create your S-Locater account</p>
        <p className="text-gray-200 italic">
          Sign up with your work email to elevate your trial with expert assistance and more.
        </p>
      </div>

      <div>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-100 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="E.g. John Doe"
            className={`w-full px-3 py-2 border ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
            required
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>}
        </div>
        {/* <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-100 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="E.g. Doe"
            className={`w-full px-3 py-2 border ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
            required
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
        </div> */}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-100 mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="E.g. john@doe.com"
          className={`w-full px-3 py-2 border ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-100 mb-1">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="E.g. +1 (555) 123-4567"
          className={`w-full px-3 py-2 border ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-100 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          placeholder="Enter your password"
          className={`w-full px-3 py-2 border ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]`}
          required
        />
        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
      </div>

      <div>
        <p className="text-sm text-gray-100 mb-2">
          What do you want to build and run with S-Locator? (Optional)
        </p>
        <select
          id="reason"
          name="reason"
          value={formData.reason}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#333333]"
        >
          <option value="">Please choose an option</option>
          <option value="None">None</option>
          <option value="Streamline-Delivery-Routes-Cut Costs">
            Streamline Delivery Routes &amp; Cut Costs
          </option>
          <option value="Gain-Real-Time-Supply-Chain-Visibility">
            Gain Real-Time Supply Chain Visibility
          </option>
          <option value="Boost-Retail-Distribution-Efficiency">
            Boost Retail &amp; Distribution Efficiency
          </option>
          <option value="Ensure-Faster-Reliable-Deliveries">
            Ensure Faster &amp; Reliable Deliveries
          </option>
          <option value="Understand-Regional-Customer-Demand">
            Understand Regional Customer Demand
          </option>
          <option value="Find-the-Best-Warehouse-Store-Locations">
            Find the Best Warehouse &amp; Store Locations
          </option>
          <option value="Forecast-Demand-with-Geospatial-Insights">
            Forecast Demand with Geospatial Insights
          </option>
        </select>
      </div>

      <p className="text-xs text-gray-400">
        By clicking "Continue," you agree to S-Locator processing your personal data in accordance
        with its Privacy Notice.
      </p>
    </>
  );
};

export default FirstPage;

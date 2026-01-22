import { FC } from 'react';
import touchLogo from '../../assets/images/touch.png';
import cityBabyLogo from '../../assets/images/city-baby.png';

const MarketingContent: FC = () => {
  return (
    <div className="flex flex-col justify-center h-full px-8 lg:px-16 py-12">
      <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
        Get started with <span className="whitespace-nowrap">S-Locator</span>
      </h1>
      <p className="text-xl text-gray-300 mb-8">
        Power your distribution with smarter location intelligence
      </p>

      <ul className="space-y-4 mb-12">
        <li className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-200 text-lg">Optimize delivery routes and reduce operational costs</span>
        </li>
        <li className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-200 text-lg">Gain full visibility into your distribution network</span>
        </li>
        <li className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-200 text-lg">Identify high-potential markets with geospatial insights</span>
        </li>
        <li className="flex items-start gap-3">
          <svg className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-gray-200 text-lg">Make data-driven decisions that drive growth</span>
        </li>
      </ul>

      <div className="mt-4">
        <p className="text-gray-300 text-lg font-medium mb-6">Trusted by</p>
        <div className="flex flex-wrap items-center gap-10">
          <img src={touchLogo} alt="Touch" className="h-14 w-auto" />
          <img src={cityBabyLogo} alt="City Baby" className="h-14 w-auto" />
        </div>
      </div>
    </div>
  );
};

export default MarketingContent;

import { FaUsers, FaLayerGroup, FaHandshake, FaExclamationTriangle } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { BusinessCategoryMetrics, CustomReportData } from '../../../types';

interface SetAttributeStepProps {
  formData: CustomReportData;
  errors?: {
    target_population?: string;
    target_income?: string;
    competition?: string;
    complementary?: string;
  };
  onInputChange: (field: string, value: any) => void;
  disabled?: boolean;
  inputCategories: string[];
  metricsData: BusinessCategoryMetrics | null;
}

const INCOME_OPTIONS = ['Low', 'Medium', 'High'];

const SetAttributeStep = ({
  formData,
  errors = {},
  onInputChange,
  disabled = false,
  inputCategories,
  metricsData,
}: SetAttributeStepProps) => {
  const [age, setTargetAge] = useState<number>(formData.target_age || 0);
  const [targetIncome, setTargetIncome] = useState<string>(formData.target_income_level || '');

  const [searchComplementary, setSearchComplementary] = useState('');
  const [searchCompetition, setSearchCompetition] = useState('');
  const [searchCross, setSearchCross] = useState('');

  const [selectedComplementary, setSelectedComplementary] = useState<string[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string[]>([]);
  const [selectedCross, setSelectedCross] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setCategories(inputCategories);
    setSelectedCompetition([...(metricsData?.competition_categories ?? [])]);
    setSelectedComplementary([...(metricsData?.complementary_categories ?? [])]);
    setSelectedCross([...(metricsData?.cross_shopping_categories ?? [])]);
  }, []);

  const onAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    onInputChange('target_age', value);
    setTargetAge(value);
  };

  const filterCategories = (query: string) =>
    categories.filter(c => c.toLowerCase().includes(query.toLowerCase()));

  const getOrderedCategories = (
    query: string,
    categories: string[],
    selected: string[]
  ): string[] => {
    const filtered = categories.filter(cat => cat.toLowerCase().includes(query.toLowerCase()));

    const selectedFiltered = selected.filter(cat => filtered.includes(cat));

    const unselected = filtered.filter(cat => !selected.includes(cat));

    return [...selectedFiltered, ...unselected];
  };
  const toggleSelection = (
    key: string,
    category: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    selected: string[]
  ) => {
    const updated = selected.includes(category)
      ? selected.filter(item => item !== category)
      : [...selected, category];

    setSelected(updated);
    onInputChange(key, updated);
  };

  // Chip selector handler
  const handleTagSelect = (
    setSelected: React.Dispatch<React.SetStateAction<string>>,
    field: string,
    value: string
  ) => {
    const updated = value;

    setSelected(updated);
    onInputChange(field, updated.toLowerCase());
  };

  // Render selectable chips
  const renderChipSelect = (
    options: string[],
    selected: string,
    setSelected: React.Dispatch<React.SetStateAction<string>>,
    field: string
  ) => (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map(option => {
        const value = option.toLowerCase();
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => handleTagSelect(setSelected, field, value)}
            className={`px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
              selected.includes(value)
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Set Attributes</h3>
        <p className="text-sm text-gray-600">
          Define demographics, competition, and complementary business attributes.
        </p>
      </div>

      {/* Demographics Section */}
      <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6">
        <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
          <FaUsers className="w-4 h-4 mr-2 text-primary" />
          Demographics
        </h4>
        {/* Population Counter */}
        <div>
          <div className="flex items-center mb-3">
            <label htmlFor="age" className="text-gray-900 font-semibold">
              Age
            </label>
            <span className="ml-3 w-full flex">
              <input
                type="number"
                id="age"
                value={age}
                onChange={onAgeChange}
                className="w-full px-3 py-2 border-2 rounded-lg text-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary border-gray-200"
              />
            </span>
          </div>
        </div>
        {/* Income Chips */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Target Income Range
          </label>
          {renderChipSelect(INCOME_OPTIONS, targetIncome, setTargetIncome, 'target_income_level')}
          {errors.target_income && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <FaExclamationTriangle className="w-4 h-4 mr-1" />
              {errors.target_income}
            </p>
          )}
        </div>
      </div>

      {/* Complementary / Competition / Cross Shopping */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Complementary*/}
        <div
          key="Complementary"
          className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <FaHandshake className="w-4 h-4 mr-2 text-primary" />
            Complementary
          </h3>

          <input
            type="text"
            placeholder="Search categories..."
            value={searchComplementary}
            onChange={e => setSearchComplementary(e.target.value)}
            disabled={disabled}
            className={`w-full border-2 rounded-xl px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none ${
              disabled
                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />

          <div className="flex flex-wrap gap-1 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {getOrderedCategories(
              searchComplementary,
              inputCategories, // your full list of category strings
              selectedComplementary
            ).map((cat: string) => {
              const isSelected = selectedComplementary.includes(cat);

              return (
                <span
                  key={cat}
                  onClick={() =>
                    toggleSelection(
                      'complementary_categories',
                      cat,
                      setSelectedComplementary,
                      selectedComplementary
                    )
                  }
                  className={`px-3 py-1 text-sm rounded-full cursor-pointer border-2 transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {cat}
                </span>
              );
            })}
          </div>
        </div>
        {/*Competition*/}
        <div
          key="Competition"
          className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <FaLayerGroup className="w-4 h-4 mr-2 text-primary" />
            Competition
          </h3>

          <input
            type="text"
            placeholder="Search categories..."
            value={searchCompetition}
            onChange={e => setSearchCompetition(e.target.value)}
            disabled={disabled}
            className={`w-full border-2 rounded-xl px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none ${
              disabled
                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />

          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {getOrderedCategories(
              searchCompetition,
              inputCategories, // same source categories as Complementary
              selectedCompetition
            ).map((cat: string) => {
              const isSelected = selectedCompetition.includes(cat);

              return (
                <span
                  key={cat}
                  onClick={() =>
                    toggleSelection(
                      'competition_categories',
                      cat,
                      setSelectedCompetition,
                      selectedCompetition
                    )
                  }
                  className={`px-3 py-1 text-sm rounded-full cursor-pointer border-2 transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {cat}
                </span>
              );
            })}
          </div>
        </div>
        {/* Cross Shopping */}
        <div
          key="Cross Shopping"
          className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-5"
        >
          <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
            <FaUsers className="w-4 h-4 mr-2 text-primary" />
            Cross Shopping
          </h3>

          <input
            type="text"
            placeholder="Search categories..."
            value={searchCross}
            onChange={e => setSearchCross(e.target.value)}
            disabled={disabled}
            className={`w-full border-2 rounded-xl px-3 py-2 mb-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none ${
              disabled
                ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />

          <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {getOrderedCategories(
              searchCross,
              inputCategories, // same main list of categories
              selectedCross
            ).map((cat: string) => {
              const isSelected = selectedCross.includes(cat);

              return (
                <span
                  key={cat}
                  onClick={() =>
                    toggleSelection(
                      'cross_shopping_categories',
                      cat,
                      setSelectedCross,
                      selectedCross
                    )
                  }
                  className={`px-3 py-1 text-sm rounded-full cursor-pointer border-2 transition-all ${
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {cat}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetAttributeStep;

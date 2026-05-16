import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { t } from '../../i18n';


const defaultData = [
  { ageGroup: '0-14', male: -10, female: 9 },
  { ageGroup: '15-24', male: -12, female: 11 },
  { ageGroup: '25-34', male: -15, female: 14 },
  { ageGroup: '35-44', male: -13, female: 14 },
  { ageGroup: '45-54', male: -11, female: 12 },
  { ageGroup: '55-64', male: -8, female: 9 },
  { ageGroup: '65+', male: -7, female: 9 },
];

interface PopulationPyramidProps {
  title?: string;
  data?: Array<{ ageGroup: string; male: number; female: number }>;
  className?: string;
}

const PopulationPyramid: React.FC<PopulationPyramidProps> = ({
  title,
  data = defaultData,
  className = '',
}) => {
  const resolvedTitle = title ?? t("population-pyramid");
  const formattedData = data.map(item => ({
    ...item,
    male: item.male < 0 ? item.male : -item.male, // Ensure male values are negative for visualization
  }));

  return (
    <div className={`bg-white p-4 rounded-lg shadow-md ${className}`}>
      <h3 className="text-xl font-semibold text-gem-dark mb-4">{resolvedTitle}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            barGap={0}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value: number) => `${Math.abs(value)}%`}
              domain={['dataMin', 'dataMax']}
            />
            <YAxis dataKey="ageGroup" type="category" tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value: number) => `${Math.abs(value)}%`}
              labelFormatter={value => `${t("age")}: ${value}`}
            />
            <Legend
              payload={[
                { value: t("male"), type: 'square', color: '#115740' },
                { value: t("female"), type: 'square', color: '#28a745' },
              ]}
            />
            <ReferenceLine x={0} stroke="#666" />
            <Bar dataKey="male" name={t("male")} fill="#115740" />
            <Bar dataKey="female" name={t("female")} fill="#28a745" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between mt-1 text-sm text-gray-500">
        <div>{t("male")}</div>
        <div>{t("female")}</div>
      </div>
    </div>
  );
};

export default PopulationPyramid;

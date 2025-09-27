import { Step, PharmacyReportData } from '../../types/allTypesAndInterfaces';
import mapConfig from '../../mapConfig.json';

export const CITY_OPTIONS = ['Riyadh', 'Mecca', 'Jeddah'];

export const TOTAL_STEPS = 4;

export const STEPS: Step[] = [
  { id: 1, title: 'Basic Information', description: 'City and location details' },
  { id: 2, title: 'Evaluation Metrics', description: 'Set importance weights' },
  { id: 3, title: 'Custom Locations', description: 'Add specific locations' },
  { id: 4, title: 'Current Location', description: 'Set your current position' },
];

export const INITIAL_FORM_DATA: PharmacyReportData = {
  user_id: '',
  city_name: 'Riyadh',
  country_name: mapConfig.fallBackCountry,
  Type: 'Pharmacy',
  evaluation_metrics: {
    traffic: 25,
    demographics: 30,
    competition: 15,
    healthcare: 20,
    complementary: 10,
  },
  custom_locations: [{ lat: 0, lng: 0 }],
  current_location: { lat: 0, lng: 0 },
};

import { MapFeatures, PolygonFeature } from '../types/allTypesAndInterfaces';
import { MarkerData, MeasurementData } from '../types/marker';
import { Descendant } from 'slate';
import { v4 as uuidv4 } from 'uuid';

// Sample coordinates for Riyadh, Saudi Arabia (center of the map)
const RIYADH_CENTER: [number, number] = [46.6753, 24.7136];

// Sample polygon around Riyadh center (cafe expansion area)
export const samplePolygon: PolygonFeature = {
  id: uuidv4(),
  type: 'Feature',
  properties: {
    name: 'Cafe Expansion Zone',
    description: 'Sample area for cafe expansion analysis',
    shape: 'polygon',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [46.6500, 24.7000], // Southwest
        [46.7000, 24.7000], // Southeast
        [46.7000, 24.7300], // Northeast
        [46.6500, 24.7300], // Northwest
        [46.6500, 24.7000], // Close the polygon
      ],
    ],
  },
  isStatisticsPopupOpen: false,
  pixelPosition: { x: 0, y: 0 },
};

// Sample points of interest (cafes only)
import { Feature } from '../types/allTypesAndInterfaces';

const generateSampleCafePoints = (center: [number, number], count: number, radius: number = 0.02): Feature[] => {
  const points: Feature[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const distance = Math.random() * radius;
    const lat = center[1] + distance * Math.cos(angle);
    const lng = center[0] + distance * Math.sin(angle);
    
    points.push({
      type: 'Feature',
      properties: {
        name: `Cafe ${i + 1}`,
        formatted_address: `Sample Cafe Location ${i + 1}, Riyadh`,
        address: `Sample Cafe Location ${i + 1}, Riyadh`,
        phone: '+966501234567',
        website: 'https://example.com',
        business_status: 'OPERATIONAL',
        rating: (Math.random() * 2 + 3).toFixed(1), // 3-5 rating
        user_ratings_total: Math.floor(Math.random() * 100 + 10),
        type: 'cafe',
      },
      display: true,
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    });
  }
  return points;
};

// Sample layer: Cafes
export const sampleCafeLayer: MapFeatures = {
  type: 'FeatureCollection',
  features: generateSampleCafePoints(RIYADH_CENTER, 15, 0.018),
  bknd_dataset_id: 'sample_cafe_dataset',
  layer_id: 'sample_cafe_layer',
  records_count: 15,
  next_page_token: '',
  layer_name: 'Cafes',
  layer_legend: 'Cafes',
  layer_description: 'Sample cafe locations for expansion analysis',
  points_color: '#4ECDC4',
  city_name: 'Riyadh',
  basedon: 'category',
  is_heatmap: false,
  is_grid: false,
  layerId: 1,
  display: true,
  isTemporary: false,
  uniqueId: uuidv4(),
};

// Sample markers
export const sampleMarkers: MarkerData[] = [
  {
    id: uuidv4(),
    name: 'Prime Location',
    description: 'High traffic area suitable for cafe expansion',
    coordinates: [46.6700, 24.7150],
    timestamp: Date.now(),
    markerType: 'saved',
    colorHEX: '#FFD93D',
    isTemporary: false,
  },
  {
    id: uuidv4(),
    name: 'Competitor Analysis',
    description: 'Existing cafe nearby - consider competition',
    coordinates: [46.6800, 24.7200],
    timestamp: Date.now(),
    markerType: 'saved',
    colorHEX: '#4ECDC4',
    isTemporary: false,
  },
];

// Sample case study content (Arabic)
export const sampleCaseStudyContent: Descendant[] = [
  {
    type: 'heading-one',
    direction: 'rtl',
    align: 'right',
    children: [{ text: 'تحليل توسع المقاهي' }],
  },
  {
    type: 'paragraph',
    direction: 'rtl',
    align: 'right',
    children: [
      {
        text: 'يُظهر هذا التحليل منطقة مثالية لتوسع المقاهي في الرياض. المنطقة تتمتع بموقع استراتيجي مع إمكانية وصول عالية وحركة مرور جيدة وكثافة سكانية عالية.',
      },
    ],
  },
  {
    type: 'heading-two',
    direction: 'rtl',
    align: 'right',
    children: [{ text: 'الاستنتاجات الرئيسية' }],
  },
  {
    type: 'paragraph',
    direction: 'rtl',
    align: 'right',
    children: [
      {
        text: '• يوجد 15 مقهى في المنطقة المستهدفة',
        bold: true,
      },
    ],
  },
  {
    type: 'paragraph',
    direction: 'rtl',
    align: 'right',
    children: [
      {
        text: '• المنطقة تتمتع بكثافة سكانية عالية',
        bold: true,
      },
    ],
  },
  {
    type: 'paragraph',
    direction: 'rtl',
    align: 'right',
    children: [
      {
        text: '• تحليل الكثافة السكانية يُظهر إمكانيات نمو ممتازة',
      },
    ],
  },
  {
    type: 'heading-two',
    direction: 'rtl',
    align: 'right',
    children: [{ text: 'التوصيات' }],
  },
  {
    type: 'paragraph',
    direction: 'rtl',
    align: 'right',
    children: [
      {
        text: 'بناءً على التحليل والكثافة السكانية، نوصي بفتح مقهى في المنطقة المحددة على الخريطة. المنطقة تتمتع بموقع استراتيجي وإمكانيات نمو عالية.',
      },
    ],
  },
];

// Sample intelligence viewport settings (Population only)
export const sampleIntelligenceViewport = {
  latitude: RIYADH_CENTER[1],
  longitude: RIYADH_CENTER[0],
  zoom: 13,
  population: true,
  income: false,
  populationSample: true,
  incomeSample: false,
  sample: true,
};

// Complete sample catalog data
export const guestCatalogSampleData = {
  geoPoints: [sampleCafeLayer],
  polygons: [samplePolygon],
  markers: sampleMarkers,
  measurements: [] as MeasurementData[],
  caseStudyContent: sampleCaseStudyContent,
  benchmarks: [
    { title: 'Population Density', value: '' },
  ],
  isBenchmarkControlOpen: false,
  currentStyle: 'mapbox://styles/mapbox/streets-v11',
  intelligenceViewport: sampleIntelligenceViewport,
  country: 'Saudi Arabia',
  city: 'Riyadh',
};


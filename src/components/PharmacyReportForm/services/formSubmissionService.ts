import apiRequest from '../../../services/apiRequest';
import urls from '../../../urls.json';
import { PharmacyReportData, ReportGenerationResponse } from '../types';

// Strategy pattern for form submission
export interface FormSubmissionStrategy {
  submit(data: PharmacyReportData): Promise<any>;
}

export class PharmacyReportSubmissionStrategy implements FormSubmissionStrategy {
  async submit(data: PharmacyReportData): Promise<ReportGenerationResponse> {
    // Ensure optional locations have default values
    const processedData = {
      ...data,
      custom_locations: data.custom_locations.map(loc => ({
        lat: loc.lat || 0,
        lng: loc.lng || 0,
      })),
      current_location: {
        lat: data.current_location.lat || 0,
        lng: data.current_location.lng || 0,
      },
    };

    const response = await apiRequest({
      url: urls.smart_pharmacy_report,
      method: 'Post',
      body: processedData,
    });

    // Handle different response formats
    if (response && typeof response === 'object') {
      // If response has metadata.html_file_path, it's a success
      if (response.data?.metadata?.html_file_path) {
        return {
          success: true,
          report_url: response.data.metadata.html_file_path,
          message: response.message || 'Report generated successfully!',
        };
      }

      // Fallback: If response has report_url, it's a success
      if (response.report_url) {
        return {
          success: true,
          report_url: response.report_url,
          message: response.message || 'Report generated successfully!',
        };
      }

      // If response has error, it's an error
      if (response.error) {
        return {
          success: false,
          error: response.error,
          message: response.message || 'Failed to generate report',
        };
      }
    }

    // Default success response
    return {
      success: true,
      report_url:
        response?.data?.metadata?.html_file_path ||
        response?.report_url ||
        response?.url ||
        response,
      message: 'Report generated successfully!',
    };
  }
}

// Factory pattern for creating submission strategies
export class FormSubmissionFactory {
  static createStrategy(type: string): FormSubmissionStrategy {
    switch (type) {
      case 'pharmacy':
        return new PharmacyReportSubmissionStrategy();
      default:
        throw new Error(`Unknown submission strategy: ${type}`);
    }
  }
}

export const submitPharmacyReport = async (
  data: PharmacyReportData
): Promise<ReportGenerationResponse> => {
  const strategy = FormSubmissionFactory.createStrategy('pharmacy');
  return await strategy.submit(data);
};

/**
 * Stub implementation of APIConfigurationService for test compatibility.
 * Replace with full implementation as needed.
 */
class APIConfigurationService {
  constructor() {}
  // Add methods as needed for tests

  static getInstance(): APIConfigurationService {
    if (!APIConfigurationService.instance) {
      APIConfigurationService.instance = new APIConfigurationService();
    }
    return APIConfigurationService.instance;
  }
  private static instance: APIConfigurationService;
}

export default APIConfigurationService;

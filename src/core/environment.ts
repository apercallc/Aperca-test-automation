import type { EnvironmentReadiness } from '../types/contracts.js';

export async function checkEnvironmentReadiness(baseUrl: string): Promise<EnvironmentReadiness> {
  try {
    const response = await fetch(baseUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    return {
      ready: response.ok,
      statusCode: response.status,
      checkedUrl: baseUrl,
      details: response.ok
        ? `Environment responded with HTTP ${response.status}`
        : `Environment responded with HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ready: false,
      checkedUrl: baseUrl,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

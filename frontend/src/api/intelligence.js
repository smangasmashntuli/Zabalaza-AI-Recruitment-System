import { get } from './client';
import { API_ENDPOINTS } from './config';

export async function getDiscoverIntelligence() {
  return get(`${API_ENDPOINTS.INTELLIGENCE}/discover`);
}



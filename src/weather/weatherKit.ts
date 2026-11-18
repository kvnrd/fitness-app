import { roundApproxLocation, type ApproxLocation } from './location.ts';

export type WeatherAttribution = {
  combinedMarkLightURL?: string;
  combinedMarkDarkURL?: string;
  legalPageURL?: string;
  legalAttributionText?: string;
};

export type WeatherKitRequest = {
  location: ApproxLocation;
  language: string;
};

/** Client never holds the WeatherKit signing key. The Edge Function signs the JWT. */
export const WEATHERKIT_KEY_IS_CLIENT_SIDE = false as const;

export function weatherKitRequest(lat: number, lon: number, language = 'en-US'): WeatherKitRequest {
  return { location: roundApproxLocation(lat, lon), language };
}

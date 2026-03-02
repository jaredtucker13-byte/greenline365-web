/**
 * Destination Live Weather
 * GET /api/destination/weather?lat=27.7253&lng=-82.7412
 *
 * Fetches current weather from Open-Meteo (free, no API key needed).
 * Returns temp, condition, humidity, UV index, and wind speed.
 */
import { NextRequest, NextResponse } from 'next/server';

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
};

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat');
  const lng = request.nextUrl.searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng required' }, { status: 400 });
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York`;

    const res = await fetch(url, { next: { revalidate: 600 } }); // cache 10 min
    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

    const data = await res.json();
    const current = data.current;

    if (!current) {
      return NextResponse.json({ error: 'No current weather data' }, { status: 502 });
    }

    return NextResponse.json({
      temp: Math.round(current.temperature_2m),
      condition: WEATHER_CODES[current.weather_code] || 'Unknown',
      humidity: current.relative_humidity_2m,
      uv_index: Math.round(current.uv_index || 0),
      wind_speed: Math.round(current.wind_speed_10m),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    });
  } catch (err: any) {
    console.error('[Destination Weather] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

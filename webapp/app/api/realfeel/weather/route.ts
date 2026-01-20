import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Weather Context API
 * 
 * Fetches weather data for "Real-Feel" booking awareness
 * Used by the AI booking agent to provide contextual suggestions
 * 
 * GET /api/realfeel/weather?zip=33619&date=2025-01-20
 * POST /api/realfeel/weather (for internal use with business context)
 */

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

interface WeatherResponse {
  current: {
    temp: number;
    feels_like: number;
    humidity: number;
    description: string;
    icon: string;
    wind_speed: number;
  };
  forecast?: {
    date: string;
    temp_high: number;
    temp_low: number;
    rain_chance: number;
    description: string;
    is_outdoor_friendly: boolean;
  };
  alerts?: {
    event: string;
    severity: number;
    description: string;
    start: string;
    end: string;
  }[];
  recommendation?: string;
}

// Convert ZIP to coordinates using OpenWeather Geocoding API
async function getCoordinatesFromZip(zip: string): Promise<{ lat: number; lon: number; city: string } | null> {
  try {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('[Weather] Geocoding failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    return {
      lat: data.lat,
      lon: data.lon,
      city: data.name
    };
  } catch (error) {
    console.error('[Weather] Geocoding error:', error);
    return null;
  }
}

// Get current weather
async function getCurrentWeather(lat: number, lon: number): Promise<any> {
  const response = await fetch(
    `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
  );
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }
  
  return response.json();
}

// Get forecast for a specific date
async function getForecast(lat: number, lon: number, targetDate?: string): Promise<any> {
  const response = await fetch(
    `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
  );
  
  if (!response.ok) {
    throw new Error(`Forecast API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // If target date specified, find matching forecast
  if (targetDate) {
    const targetDateObj = new Date(targetDate);
    const matchingForecast = data.list.find((item: any) => {
      const forecastDate = new Date(item.dt * 1000);
      return forecastDate.toDateString() === targetDateObj.toDateString();
    });
    
    return matchingForecast || data.list[0];
  }
  
  return data;
}

// Get weather alerts
async function getWeatherAlerts(lat: number, lon: number): Promise<any[]> {
  try {
    // Use One Call API for alerts (requires subscription for some features)
    const response = await fetch(
      `${OPENWEATHER_BASE_URL}/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.alerts || [];
    }
  } catch (error) {
    console.log('[Weather] Alerts not available');
  }
  
  return [];
}

// Generate booking recommendation based on weather
function generateRecommendation(
  weather: any,
  forecast: any,
  isOutdoorBusiness: boolean,
  rainThreshold: number = 50
): string {
  const rainChance = forecast?.pop ? forecast.pop * 100 : 0;
  const temp = forecast?.main?.temp || weather?.main?.temp || 70;
  const description = forecast?.weather?.[0]?.description || weather?.weather?.[0]?.description || '';
  
  // For outdoor businesses
  if (isOutdoorBusiness) {
    if (rainChance > rainThreshold) {
      return `I see there's a ${Math.round(rainChance)}% chance of rain. Would you prefer to look at a different day when it's clearer?`;
    }
    
    if (temp > 95) {
      return `It's going to be quite hot (${Math.round(temp)}°F). Would you prefer an earlier morning slot to avoid the heat?`;
    }
    
    if (temp < 40) {
      return `It's looking pretty cold (${Math.round(temp)}°F). Would you like to reschedule for a warmer day?`;
    }
    
    if (description.includes('storm') || description.includes('thunder')) {
      return `There might be storms in the forecast. Let me suggest some alternative dates for you.`;
    }
  }
  
  // For indoor businesses during severe weather
  if (description.includes('blizzard') || description.includes('hurricane')) {
    return `Due to severe weather conditions, we may need to reschedule. Let me check availability for later this week.`;
  }
  
  return ''; // No recommendation needed
}

// GET - Public weather check
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');
  const date = searchParams.get('date');
  const businessId = searchParams.get('business_id');
  
  if (!zip) {
    return NextResponse.json({ error: 'ZIP code required' }, { status: 400 });
  }
  
  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json({ 
      error: 'Weather API not configured',
      mock: true,
      current: {
        temp: 72,
        feels_like: 74,
        humidity: 65,
        description: 'partly cloudy',
        wind_speed: 8
      }
    });
  }
  
  try {
    // Get coordinates from ZIP
    const coords = await getCoordinatesFromZip(zip);
    if (!coords) {
      return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
    }
    
    // Get current weather
    const currentWeather = await getCurrentWeather(coords.lat, coords.lon);
    
    // Get forecast if date specified
    let forecast = null;
    if (date) {
      forecast = await getForecast(coords.lat, coords.lon, date);
    }
    
    // Get alerts
    const alerts = await getWeatherAlerts(coords.lat, coords.lon);
    
    // Check if business is weather-dependent
    let isOutdoorBusiness = false;
    let rainThreshold = 50;
    
    if (businessId) {
      const supabase = await createClient();
      const { data: business } = await supabase
        .from('businesses')
        .select('is_weather_dependent, weather_threshold, context_config')
        .eq('id', businessId)
        .single();
      
      if (business) {
        isOutdoorBusiness = business.is_weather_dependent || 
          business.context_config?.industry_type === 'outdoor';
        rainThreshold = business.weather_threshold || 50;
      }
    }
    
    // Generate recommendation
    const recommendation = generateRecommendation(
      currentWeather, 
      forecast, 
      isOutdoorBusiness, 
      rainThreshold
    );
    
    const response: WeatherResponse = {
      current: {
        temp: Math.round(currentWeather.main.temp),
        feels_like: Math.round(currentWeather.main.feels_like),
        humidity: currentWeather.main.humidity,
        description: currentWeather.weather[0].description,
        icon: currentWeather.weather[0].icon,
        wind_speed: Math.round(currentWeather.wind.speed)
      }
    };
    
    if (forecast) {
      const rainChance = forecast.pop ? forecast.pop * 100 : 0;
      response.forecast = {
        date: date || new Date().toISOString().split('T')[0],
        temp_high: Math.round(forecast.main?.temp_max || forecast.main?.temp || 75),
        temp_low: Math.round(forecast.main?.temp_min || forecast.main?.temp - 10 || 65),
        rain_chance: Math.round(rainChance),
        description: forecast.weather?.[0]?.description || 'clear',
        is_outdoor_friendly: rainChance < rainThreshold && 
          (forecast.main?.temp || 70) > 40 && 
          (forecast.main?.temp || 70) < 95
      };
    }
    
    if (alerts.length > 0) {
      response.alerts = alerts.map((alert: any) => ({
        event: alert.event,
        severity: alert.tags?.includes('Extreme') ? 5 : 
                  alert.tags?.includes('Severe') ? 4 : 
                  alert.tags?.includes('Moderate') ? 3 : 2,
        description: alert.description,
        start: new Date(alert.start * 1000).toISOString(),
        end: new Date(alert.end * 1000).toISOString()
      }));
    }
    
    if (recommendation) {
      response.recommendation = recommendation;
    }
    
    return NextResponse.json({
      success: true,
      location: {
        zip,
        city: coords.city,
        lat: coords.lat,
        lon: coords.lon
      },
      weather: response
    });
    
  } catch (error: any) {
    console.error('[Weather API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Internal use with full context
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { business_id, zip_code, appointment_date, check_alerts } = body;
    
    if (!business_id || !zip_code) {
      return NextResponse.json({ 
        error: 'business_id and zip_code required' 
      }, { status: 400 });
    }
    
    // Get business config
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', business_id)
      .single();
    
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    
    // Check if weather awareness is needed
    const shouldCheckWeather = business.is_weather_dependent || 
      business.context_config?.weather_gate?.enabled ||
      check_alerts;
    
    if (!shouldCheckWeather && !check_alerts) {
      return NextResponse.json({
        success: true,
        weather_check_skipped: true,
        reason: 'Business is not weather-dependent'
      });
    }
    
    // Get coordinates
    const coords = await getCoordinatesFromZip(zip_code);
    if (!coords) {
      return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 });
    }
    
    // Get weather data
    const currentWeather = await getCurrentWeather(coords.lat, coords.lon);
    const forecast = appointment_date 
      ? await getForecast(coords.lat, coords.lon, appointment_date)
      : null;
    const alerts = await getWeatherAlerts(coords.lat, coords.lon);
    
    // Generate recommendation
    const isOutdoor = business.is_weather_dependent || 
      business.context_config?.industry_type === 'outdoor';
    const threshold = business.weather_threshold || 
      business.context_config?.weather_gate?.rain_threshold || 50;
    
    const recommendation = generateRecommendation(
      currentWeather, 
      forecast, 
      isOutdoor, 
      threshold
    );
    
    // Check for severe weather and update business status if needed
    if (alerts.length > 0) {
      const severeAlert = alerts.find((a: any) => 
        a.tags?.includes('Extreme') || a.tags?.includes('Severe')
      );
      
      if (severeAlert) {
        // Log weather alert
        await supabase.from('weather_alerts').insert({
          business_id,
          alert_type: severeAlert.event,
          severity_level: severeAlert.tags?.includes('Extreme') ? 5 : 4,
          zip_code,
          city: coords.city,
          weather_data: severeAlert,
          forecast_summary: severeAlert.description,
          valid_from: new Date(severeAlert.start * 1000).toISOString(),
          valid_until: new Date(severeAlert.end * 1000).toISOString()
        });
        
        // Update business status
        await supabase.rpc('update_business_weather_status', {
          p_business_id: business_id,
          p_severity_level: severeAlert.tags?.includes('Extreme') ? 5 : 4,
          p_alert_type: severeAlert.event
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      business_id,
      location: { zip_code, city: coords.city },
      weather: {
        current: {
          temp: Math.round(currentWeather.main.temp),
          feels_like: Math.round(currentWeather.main.feels_like),
          description: currentWeather.weather[0].description
        },
        forecast: forecast ? {
          date: appointment_date,
          rain_chance: Math.round((forecast.pop || 0) * 100),
          temp: Math.round(forecast.main?.temp || currentWeather.main.temp),
          description: forecast.weather?.[0]?.description
        } : null,
        alerts: alerts.length,
        has_severe_alert: alerts.some((a: any) => 
          a.tags?.includes('Extreme') || a.tags?.includes('Severe')
        )
      },
      recommendation,
      should_suggest_reschedule: !!recommendation
    });
    
  } catch (error: any) {
    console.error('[Weather POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

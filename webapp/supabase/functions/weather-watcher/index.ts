// Supabase Edge Function: Weather Watcher
// This function monitors weather conditions and triggers automated actions
// 
// Deploy: supabase functions deploy weather-watcher
// Schedule: Set up a cron trigger via Supabase dashboard or use pg_cron

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface Business {
  id: string;
  name: string;
  zip_code: string;
  is_weather_dependent: boolean;
  weather_threshold: number;
  context_config: any;
  tenant_status: string;
}

interface WeatherAlert {
  event: string;
  severity: string;
  description: string;
  start: number;
  end: number;
}

// Severity mapping for weather events
const SEVERITY_MAP: Record<string, number> = {
  "Extreme": 5,
  "Severe": 4,
  "Moderate": 3,
  "Minor": 2,
  "Unknown": 1,
};

// Events that should trigger emergency mode
const EMERGENCY_EVENTS = [
  "Hurricane",
  "Tornado",
  "Blizzard",
  "Ice Storm",
  "Flood",
  "Winter Storm",
  "Severe Thunderstorm",
];

async function getCoordinatesFromZip(zip: string): Promise<{ lat: number; lon: number; city: string } | null> {
  try {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return { lat: data.lat, lon: data.lon, city: data.name };
  } catch {
    return null;
  }
}

async function getWeatherAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.alerts || [];
  } catch {
    return [];
  }
}

async function getForecast(lat: number, lon: number): Promise<any> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial&cnt=8`
    );
    
    if (!response.ok) return null;
    
    return response.json();
  } catch {
    return null;
  }
}

function getSeverityLevel(alert: WeatherAlert): number {
  // Check event name for emergency keywords
  for (const event of EMERGENCY_EVENTS) {
    if (alert.event.toLowerCase().includes(event.toLowerCase())) {
      return 4; // At least severe
    }
  }
  
  // Check severity tag if available
  if (alert.severity && SEVERITY_MAP[alert.severity]) {
    return SEVERITY_MAP[alert.severity];
  }
  
  return 2; // Default minor
}

serve(async (req) => {
  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get all weather-dependent businesses with zip codes
    const { data: businesses, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, zip_code, is_weather_dependent, weather_threshold, context_config, tenant_status")
      .eq("is_active", true)
      .not("zip_code", "is", null);
    
    if (bizError) {
      throw new Error(`Failed to fetch businesses: ${bizError.message}`);
    }
    
    const results: any[] = [];
    
    for (const business of businesses || []) {
      const biz = business as Business;
      
      // Skip businesses without weather config
      if (!biz.zip_code) continue;
      
      // Get coordinates
      const coords = await getCoordinatesFromZip(biz.zip_code);
      if (!coords) {
        results.push({ business: biz.name, status: "skipped", reason: "invalid_zip" });
        continue;
      }
      
      // Get weather alerts
      const alerts = await getWeatherAlerts(coords.lat, coords.lon);
      
      // Get forecast for rain check (for outdoor businesses)
      let shouldWarnRain = false;
      if (biz.is_weather_dependent) {
        const forecast = await getForecast(coords.lat, coords.lon);
        if (forecast?.list) {
          const rainChance = Math.max(...forecast.list.map((f: any) => (f.pop || 0) * 100));
          shouldWarnRain = rainChance > (biz.weather_threshold || 50);
        }
      }
      
      // Process alerts
      let newStatus = "normal";
      let severeAlertFound = null;
      
      for (const alert of alerts) {
        const severity = getSeverityLevel(alert);
        
        // Check if this is an emergency-level event
        if (severity >= 4) {
          newStatus = "extreme_weather";
          severeAlertFound = alert;
          
          // Log the weather alert
          await supabase.from("weather_alerts").insert({
            business_id: biz.id,
            alert_type: alert.event,
            severity_level: severity,
            zip_code: biz.zip_code,
            city: coords.city,
            weather_data: alert,
            forecast_summary: alert.description,
            valid_from: new Date(alert.start * 1000).toISOString(),
            valid_until: new Date(alert.end * 1000).toISOString(),
          });
        }
      }
      
      // Update business status if changed
      if (newStatus !== biz.tenant_status) {
        await supabase
          .from("businesses")
          .update({ tenant_status: newStatus })
          .eq("id", biz.id);
        
        results.push({
          business: biz.name,
          status: "updated",
          old_status: biz.tenant_status,
          new_status: newStatus,
          alert: severeAlertFound?.event,
        });
      } else if (shouldWarnRain && biz.is_weather_dependent) {
        results.push({
          business: biz.name,
          status: "rain_warning",
          message: "High chance of rain in forecast",
        });
      } else {
        results.push({
          business: biz.name,
          status: "checked",
          alerts_found: alerts.length,
        });
      }
      
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        businesses_checked: results.length,
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Weather Watcher Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

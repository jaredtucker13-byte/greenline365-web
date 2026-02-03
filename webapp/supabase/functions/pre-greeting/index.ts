// Pre-Greeting Edge Function
// This function runs instantly when a call comes in to provide
// the Retell AI agent with all context BEFORE the greeting.
// 
// Features:
// - Caller phone lookup → Contact → Property → Assets
// - Confidence score calculation
// - Relationship score (CRS) determination
// - Cal.com availability caching (60 seconds)
// - Weather intelligence with alerts and recommendations
// - Location flavor injection
// - Witty hooks rotation (prevents repetition)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-tenant-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Simple in-memory cache for Cal.com availability and weather
const availabilityCache: Map<string, { slots: string[]; timestamp: number }> = new Map();
const weatherCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL_MS = 60000; // 60 seconds
const WEATHER_CACHE_TTL_MS = 300000; // 5 minutes for weather

// OpenWeather API helper
async function getWeatherContext(zipCode: string): Promise<any> {
  const OPENWEATHER_API_KEY = Deno.env.get('OPENWEATHER_API_KEY');
  
  if (!OPENWEATHER_API_KEY || !zipCode) {
    return null;
  }
  
  // Check cache
  const cacheKey = `weather-${zipCode}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < WEATHER_CACHE_TTL_MS) {
    console.log('[Pre-Greeting] Using cached weather data');
    return cached.data;
  }
  
  try {
    // Get coordinates from ZIP
    const geoResponse = await fetch(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!geoResponse.ok) {
      console.error('[Pre-Greeting] Geocoding failed');
      return null;
    }
    
    const geoData = await geoResponse.json();
    const { lat, lon, name: city } = geoData;
    
    // Get current weather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    if (!weatherResponse.ok) {
      console.error('[Pre-Greeting] Weather API failed');
      return null;
    }
    
    const weatherData = await weatherResponse.json();
    
    // Get forecast for today/tomorrow
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=imperial`
    );
    
    let forecastData = null;
    let alerts: any[] = [];
    
    if (forecastResponse.ok) {
      const fullForecast = await forecastResponse.json();
      forecastData = fullForecast.list?.slice(0, 8) || []; // Next 24 hours
      
      // Check for severe weather in forecast
      for (const period of forecastData) {
        const desc = period.weather?.[0]?.description?.toLowerCase() || '';
        if (desc.includes('thunder') || desc.includes('storm') || desc.includes('tornado') || desc.includes('hurricane')) {
          alerts.push({
            event: period.weather?.[0]?.main || 'Severe Weather',
            description: period.weather?.[0]?.description,
            time: new Date(period.dt * 1000).toISOString(),
            severity: desc.includes('tornado') || desc.includes('hurricane') ? 'extreme' : 'severe'
          });
        }
      }
    }
    
    // Try to get alerts from One Call API (may require subscription)
    try {
      const alertsResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily&appid=${OPENWEATHER_API_KEY}`
      );
      if (alertsResponse.ok) {
        const alertsData = await alertsResponse.json();
        if (alertsData.alerts && alertsData.alerts.length > 0) {
          alerts = alertsData.alerts.map((a: any) => ({
            event: a.event,
            description: a.description,
            start: new Date(a.start * 1000).toISOString(),
            end: new Date(a.end * 1000).toISOString(),
            severity: a.tags?.includes('Extreme') ? 'extreme' : 'severe'
          }));
        }
      }
    } catch (e) {
      // Alerts API may not be available
    }
    
    const result = {
      city,
      current: {
        temp: Math.round(weatherData.main?.temp || 70),
        feels_like: Math.round(weatherData.main?.feels_like || 70),
        humidity: weatherData.main?.humidity || 50,
        description: weatherData.weather?.[0]?.description || 'clear',
        icon: weatherData.weather?.[0]?.icon
      },
      alerts,
      has_severe_alert: alerts.length > 0,
      recommendation: generateWeatherRecommendation(weatherData, forecastData, alerts)
    };
    
    // Cache the result
    weatherCache.set(cacheKey, { data: result, timestamp: Date.now() });
    console.log(`[Pre-Greeting] Cached weather for ${zipCode}: ${result.current.temp}°F, ${alerts.length} alerts`);
    
    return result;
  } catch (error) {
    console.error('[Pre-Greeting] Weather error:', error);
    return null;
  }
}

// Generate weather-based booking recommendation
function generateWeatherRecommendation(current: any, forecast: any[], alerts: any[]): string | null {
  // Check for severe alerts first
  if (alerts && alerts.length > 0) {
    const severe = alerts.find((a: any) => a.severity === 'extreme' || a.severity === 'severe');
    if (severe) {
      return `I see there's a ${severe.event} warning for your area. For safety, I'd recommend we look at times after the weather clears.`;
    }
  }
  
  // Check forecast for storms
  if (forecast && forecast.length > 0) {
    const stormPeriod = forecast.find((p: any) => {
      const desc = p.weather?.[0]?.description?.toLowerCase() || '';
      return desc.includes('thunder') || desc.includes('storm');
    });
    
    if (stormPeriod) {
      const stormTime = new Date(stormPeriod.dt * 1000);
      const hours = stormTime.getHours();
      const timeStr = hours >= 12 ? `${hours - 12 || 12} PM` : `${hours || 12} AM`;
      return `I see thunderstorms in the forecast around ${timeStr}. Would you prefer a morning slot before the storms, or tomorrow when it's clearer?`;
    }
  }
  
  // Check for extreme temperatures
  const temp = current?.main?.temp || 70;
  if (temp > 95) {
    return `It's quite hot today at ${Math.round(temp)}°F. Would you prefer an early morning slot to beat the heat?`;
  }
  
  if (temp < 35) {
    return `It's pretty cold at ${Math.round(temp)}°F. Our techs are prepared, but would you prefer to wait for warmer weather?`;
  }
  
  return null; // No weather concerns
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const body = await req.json();
    const {
      caller_phone,
      to_phone,
      tenant_id: providedTenantId,
      call_id,
    } = body;

    console.log(`[Pre-Greeting] Incoming call from ${caller_phone} to ${to_phone}`);

    // Normalize phone number
    const normalizedPhone = caller_phone?.replace(/[^0-9]/g, '') || '';
    
    // 1. Get Tenant Context
    let tenant = null;
    if (providedTenantId) {
      const { data } = await supabase
        .from('businesses')
        .select(`
          *,
          industry_config:industry_config_id(*),
          location_flavor:location_flavor_id(*)
        `)
        .eq('id', providedTenantId)
        .single();
      tenant = data;
    } else if (to_phone) {
      // Look up tenant by Twilio phone number
      const normalizedToPhone = to_phone.replace(/[^0-9]/g, '');
      const { data } = await supabase
        .from('businesses')
        .select(`
          *,
          industry_config:industry_config_id(*),
          location_flavor:location_flavor_id(*)
        `)
        .or(`twilio_phone_number.ilike.%${normalizedToPhone}%,phone.ilike.%${normalizedToPhone}%`)
        .single();
      tenant = data;
    }

    if (!tenant) {
      // Default to first active tenant or platform tenant
      const { data } = await supabase
        .from('businesses')
        .select(`
          *,
          industry_config:industry_config_id(*),
          location_flavor:location_flavor_id(*)
        `)
        .eq('is_active', true)
        .limit(1)
        .single();
      tenant = data;
    }

    const tenantId = tenant?.id;
    const companyName = tenant?.name || 'our company';
    const industryConfig = tenant?.industry_config;
    const locationFlavor = tenant?.location_flavor;

    // 2. Look up Contact by Phone
    let contact = null;
    let property = null;
    let assets: any[] = [];
    let isNewCaller = true;
    let lastInteraction = null;

    if (normalizedPhone && tenantId) {
      const { data: contactData } = await supabase
        .from('contacts')
        .select(`
          *,
          property:property_id(*)
        `)
        .eq('tenant_id', tenantId)
        .eq('phone_normalized', normalizedPhone)
        .single();

      if (contactData) {
        contact = contactData;
        property = contactData.property;
        isNewCaller = false;

        // 3. Get Assets for Property
        if (property?.id) {
          const { data: assetData } = await supabase
            .from('assets')
            .select('*')
            .eq('property_id', property.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
          
          assets = assetData || [];
        }

        // 4. Get Last Interaction (for greeting variety)
        const { data: interactionData } = await supabase
          .from('interactions')
          .select('*')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        lastInteraction = interactionData;
      }
    }

    // 5. Calculate Confidence Score for Primary Asset
    let confidenceScore = 100;
    let primaryAsset = null;
    
    if (assets.length > 0) {
      primaryAsset = assets[0];
      const staleYears = industryConfig?.decay_logic?.stale_years || 5;
      const unreliableYears = industryConfig?.decay_logic?.unreliable_years || 10;
      
      if (primaryAsset.install_date) {
        const installDate = new Date(primaryAsset.install_date);
        const ageYears = (Date.now() - installDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        
        if (ageYears <= staleYears) {
          confidenceScore = Math.max(50, 100 - Math.floor(ageYears * 5));
        } else if (ageYears <= unreliableYears) {
          confidenceScore = Math.max(30, 75 - Math.floor((ageYears - staleYears) * 10));
        } else {
          confidenceScore = Math.max(10, 30 - Math.floor((ageYears - unreliableYears) * 3));
        }
        
        // Boost for recent verification
        if (primaryAsset.last_verified) {
          const daysSinceVerified = (Date.now() - new Date(primaryAsset.last_verified).getTime()) / (24 * 60 * 60 * 1000);
          if (daysSinceVerified <= 30) confidenceScore = Math.min(100, confidenceScore + 20);
          else if (daysSinceVerified <= 90) confidenceScore = Math.min(100, confidenceScore + 10);
          else if (daysSinceVerified <= 365) confidenceScore = Math.min(100, confidenceScore + 5);
        }
      }
    }

    // 6. Determine Relationship Score (CRS)
    const relationshipScore = contact?.relationship_score || 50;
    
    // Map CRS to vibe category
    let vibeCategory: 'stranger' | 'regular' | 'vip';
    if (relationshipScore <= 30) {
      vibeCategory = 'stranger';
    } else if (relationshipScore <= 70) {
      vibeCategory = 'regular';
    } else {
      vibeCategory = 'vip';
    }

    // 7. Select Witty Hook (avoid repetition)
    let selectedWittyHook = null;
    let selectedJokeId = null;
    const lastJokeId = lastInteraction?.joke_id;
    
    // Combine location-specific and industry-specific hooks
    const allHooks: { id: number; text: string }[] = [];
    
    if (locationFlavor?.witty_hooks) {
      const locationHooks = Array.isArray(locationFlavor.witty_hooks) 
        ? locationFlavor.witty_hooks 
        : JSON.parse(locationFlavor.witty_hooks);
      locationHooks.forEach((hook: string, idx: number) => {
        allHooks.push({ id: idx + 1, text: hook });
      });
    }
    
    if (industryConfig?.witty_hooks) {
      const industryHooks = Array.isArray(industryConfig.witty_hooks)
        ? industryConfig.witty_hooks
        : JSON.parse(industryConfig.witty_hooks);
      industryHooks.forEach((hook: string, idx: number) => {
        allHooks.push({ id: 100 + idx + 1, text: hook });
      });
    }
    
    // Filter out last used hook and select randomly
    const availableHooks = allHooks.filter(h => h.id !== lastJokeId);
    if (availableHooks.length > 0) {
      const selected = availableHooks[Math.floor(Math.random() * availableHooks.length)];
      selectedWittyHook = selected.text;
      selectedJokeId = selected.id;
    } else if (allHooks.length > 0) {
      // All hooks used, just pick any
      const selected = allHooks[Math.floor(Math.random() * allHooks.length)];
      selectedWittyHook = selected.text;
      selectedJokeId = selected.id;
    }

    // 8. Get Cal.com Availability (with caching)
    let availableSlots: string[] = [];
    const calcomApiKey = Deno.env.get('CALCOM_API_KEY');
    const calcomEventTypeId = Deno.env.get('CALCOM_EVENT_TYPE_ID');
    
    if (calcomApiKey && calcomEventTypeId) {
      const cacheKey = `${calcomEventTypeId}-${new Date().toISOString().split('T')[0]}`;
      const cached = availabilityCache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        // Use cached availability
        availableSlots = cached.slots;
        console.log('[Pre-Greeting] Using cached Cal.com availability');
      } else {
        // Fetch fresh availability
        try {
          const today = new Date().toISOString().split('T')[0];
          const response = await fetch(
            `https://api.cal.com/v1/slots?apiKey=${calcomApiKey}&eventTypeId=${calcomEventTypeId}&startTime=${today}T00:00:00Z&endTime=${today}T23:59:59Z&timeZone=America/New_York`,
            { method: 'GET' }
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.slots) {
              for (const [_, dateSlots] of Object.entries(data.slots)) {
                if (Array.isArray(dateSlots)) {
                  for (const slot of dateSlots) {
                    const time = (slot as any).time || slot;
                    if (typeof time === 'string') {
                      const d = new Date(time);
                      availableSlots.push(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`);
                    }
                  }
                }
              }
            }
          }
          
          // Cache the result
          availabilityCache.set(cacheKey, { slots: availableSlots, timestamp: Date.now() });
          console.log(`[Pre-Greeting] Cached ${availableSlots.length} Cal.com slots`);
        } catch (error) {
          console.error('[Pre-Greeting] Cal.com availability error:', error);
        }
      }
    }

    // 9. Build Verification Prompt if Confidence is Low
    let verificationPrompt = null;
    if (confidenceScore < 70 && primaryAsset && industryConfig?.verification_prompt) {
      const installYear = primaryAsset.install_date 
        ? new Date(primaryAsset.install_date).getFullYear()
        : 'unknown';
      
      verificationPrompt = industryConfig.verification_prompt
        .replace('{{brand}}', primaryAsset.brand || 'the')
        .replace('{{install_year}}', installYear.toString())
        .replace('{{asset_type}}', primaryAsset.asset_type || 'equipment');
    }

    // 10. Build Response Variables for Retell
    const response = {
      success: true,
      
      // Identity flags
      is_new_caller: isNewCaller,
      has_property_history: property !== null,
      
      // Contact info
      contact_id: contact?.id || null,
      contact_name: contact?.full_name || null,
      customer_name: contact?.first_name || null,
      customer_email: contact?.email || null,
      customer_phone: caller_phone,
      
      // Property info
      property_id: property?.id || null,
      property_address: property?.full_address || null,
      gate_code: property?.gate_code || null,
      
      // Asset info
      primary_asset: primaryAsset ? {
        id: primaryAsset.id,
        type: primaryAsset.asset_type,
        brand: primaryAsset.brand,
        model: primaryAsset.model_number,
        install_date: primaryAsset.install_date,
        install_year: primaryAsset.install_date ? new Date(primaryAsset.install_date).getFullYear() : null,
        metadata: primaryAsset.metadata,
      } : null,
      asset_count: assets.length,
      
      // Scoring
      confidence_score: confidenceScore,
      relationship_score: relationshipScore,
      vibe_category: vibeCategory,
      
      // Verification
      needs_verification: confidenceScore < 70,
      verification_prompt: verificationPrompt,
      
      // Wit & Humor
      witty_hook: selectedWittyHook,
      joke_id: selectedJokeId,
      climate_quirk: locationFlavor?.climate_quirk || null,
      location_name: locationFlavor?.location_name || null,
      
      // Availability
      available_slots_today: availableSlots.slice(0, 4),
      has_availability: availableSlots.length > 0,
      
      // Business context
      company_name: companyName,
      tenant_id: tenantId,
      industry_type: industryConfig?.industry_type || null,
      owner_name: tenant?.owner_name || null,
      transfer_phone: tenant?.transfer_phone_number || null,
      
      // Emergency keywords for this industry
      emergency_keywords: industryConfig?.emergency_keywords || [],
      
      // Tracking
      call_id: call_id,
      timestamp: new Date().toISOString(),
    };

    console.log(`[Pre-Greeting] Response built for ${isNewCaller ? 'NEW' : 'RETURNING'} caller, CRS: ${relationshipScore}, Confidence: ${confidenceScore}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Pre-Greeting] Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      is_new_caller: true,
      has_property_history: false,
      confidence_score: 100,
      relationship_score: 50,
      vibe_category: 'stranger',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

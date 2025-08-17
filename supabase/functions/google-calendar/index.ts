import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  start: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
    timeZone?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { calendarId, operation = 'GET', timeMin, timeMax, eventData, eventId } = body;
    
    if (!calendarId) {
      throw new Error('Calendar ID is required');
    }

    // Get secrets from environment
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Google OAuth credentials not configured');
    }

    console.log('Refreshing Google access token...');
    
    // Step 1: Get a fresh access token using the refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token refresh failed:', errorData);
      throw new Error(`Failed to refresh token: ${tokenResponse.status}`);
    }

    const tokenData: GoogleTokenResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    console.log('Access token refreshed successfully');

    // Step 2: Handle different operations
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    
    if (operation === 'GET') {
      // Fetch events (existing functionality)
      const calendarUrl = new URL(baseUrl);
      calendarUrl.searchParams.set('singleEvents', 'true');
      calendarUrl.searchParams.set('orderBy', 'startTime');
      calendarUrl.searchParams.set('maxResults', '2500');
      
      if (timeMin) {
        calendarUrl.searchParams.set('timeMin', timeMin);
      }
      
      if (timeMax) {
        calendarUrl.searchParams.set('timeMax', timeMax);
      }

      console.log('Fetching calendar events...');

      const calendarResponse = await fetch(calendarUrl.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.text();
        console.error('Calendar API failed:', errorData);
        throw new Error(`Calendar API request failed: ${calendarResponse.status}`);
      }

      const calendarData = await calendarResponse.json();
      const events: GoogleCalendarEvent[] = calendarData.items || [];

      console.log(`Successfully fetched ${events.length} events`);

      return new Response(JSON.stringify({ 
        success: true,
        events: events,
        total: events.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (operation === 'CREATE') {
      // Create new event
      if (!eventData) {
        throw new Error('Event data is required for creating events');
      }

      console.log('Creating new event...');

      const createResponse = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.text();
        console.error('Event creation failed:', errorData);
        throw new Error(`Failed to create event: ${createResponse.status}`);
      }

      const createdEvent = await createResponse.json();
      console.log(`Successfully created event: ${createdEvent.id}`);

      return new Response(JSON.stringify({ 
        success: true,
        event: createdEvent,
        message: 'Evento creado exitosamente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (operation === 'UPDATE') {
      // Update existing event
      if (!eventId || !eventData) {
        throw new Error('Event ID and event data are required for updating events');
      }

      console.log(`Updating event: ${eventId}`);

      const updateResponse = await fetch(`${baseUrl}/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.text();
        console.error('Event update failed:', errorData);
        throw new Error(`Failed to update event: ${updateResponse.status}`);
      }

      const updatedEvent = await updateResponse.json();
      console.log(`Successfully updated event: ${updatedEvent.id}`);

      return new Response(JSON.stringify({ 
        success: true,
        event: updatedEvent,
        message: 'Evento actualizado exitosamente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (operation === 'DELETE') {
      // Delete event
      if (!eventId) {
        throw new Error('Event ID is required for deleting events');
      }

      console.log(`Deleting event: ${eventId}`);

      const deleteResponse = await fetch(`${baseUrl}/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.text();
        console.error('Event deletion failed:', errorData);
        throw new Error(`Failed to delete event: ${deleteResponse.status}`);
      }

      console.log(`Successfully deleted event: ${eventId}`);

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Evento eliminado exitosamente'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error(`Unsupported operation: ${operation}`);
    }

  } catch (error) {
    console.error('Error in google-calendar function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      events: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
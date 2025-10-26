// Google Maps & Places API Service
import * as Location from 'expo-location';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

// Fetch nearby safe places (police stations, hospitals)
export const getNearbyPlaces = async (latitude, longitude, radius = 5000) => {
  try {
    const types = ['police', 'hospital', 'fire_station'];
    const allPlaces = [];

    for (const type of types) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        const places = data.results.slice(0, 5).map(place => ({
          id: place.place_id,
          name: place.name,
          type: type,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          address: place.vicinity,
          rating: place.rating || 'N/A',
          isOpen: place.opening_hours?.open_now,
        }));
        allPlaces.push(...places);
      }
    }

    return allPlaces;
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    return [];
  }
};

// Calculate safe route between two points
export const getSafeRoute = async (origin, destination, routeType = 'safest') => {
  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;
    
    // Determine route preferences based on type
    let avoid = '';
    if (routeType === 'safest') {
      avoid = ''; // Can add avoid=tolls or avoid=highways
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=walking&alternatives=true${avoid ? '&avoid=' + avoid : ''}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      // Return the first route with details
      const route = data.routes[0];
      const leg = route.legs[0];
      
      return {
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.text,
          duration: step.duration.text,
          startLocation: step.start_location,
          endLocation: step.end_location,
        })),
        polyline: route.overview_polyline.points,
        bounds: route.bounds,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching safe route:', error);
    return null;
  }
};

// Decode polyline for map rendering
export const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return poly;
};

// Get place details
export const getPlaceDetails = async (placeId) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return data.result;
    }

    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
};

// Calculate distance between two coordinates
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance.toFixed(2); // Distance in km
};

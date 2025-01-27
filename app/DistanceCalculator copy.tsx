"use client";
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";
import polyline from "@mapbox/polyline"; // Use the polyline library to decode the polyline data
import "leaflet/dist/leaflet.css";
import styles from './DistanceCalculator.module.css'; // Import the CSS module

// Define the types for the suggestion response
interface Location {
  lat: number;
  lng: number;
}

interface Prediction {
  description: string;
  geometry: {
    location: Location;
  };
}

interface SuggestionResponse {
  predictions: Prediction[];
}

interface Suggestion {
  description: string;
  latitude: number;
  longitude: number;
}

const DistanceCalculator = () => {
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [originCoords, setOriginCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [distance, setDistance] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showSuggestionsOrigin, setShowSuggestionsOrigin] =
    useState<boolean>(false);
  const [showSuggestionsDestination, setShowSuggestionsDestination] =
    useState<boolean>(false);
  const [routeCoordinates, setRouteCoordinates] = useState<
    Array<[number, number]>
  >([]);
  const [clickCount, setClickCount] = useState(0);

  // Take the real address from the user database
  const sameAsMyAddress = "Kakching, Manipur, India";

  // Set origin and destination to my address
  const setSameAsMyAddressOrigin = () => {
    const originInput = document.querySelector('input[placeholder="Enter origin"]') as HTMLInputElement;
    setOrigin(sameAsMyAddress);
    fetchSuggestions(sameAsMyAddress);
    setShowSuggestionsOrigin(true);
  };

  const setSameAsMyAddressDest = () => {
    const destinationInput = document.querySelector('input[placeholder="Enter destination"]') as HTMLInputElement;
    if (destinationInput) {
      destinationInput.focus();
    }
    setDestination(sameAsMyAddress);
    fetchSuggestions(sameAsMyAddress);
    setShowSuggestionsDestination(true);
  };

  // Function to fetch suggestions for origin/destination
  const fetchSuggestions = async (input: string) => {
    try {
      const response = await fetch(`/api/autocomplete?input=${input}`);
      if (!response.ok) {
        console.error("Error fetching suggestions:", response.statusText);
        return;
      }

      const data: SuggestionResponse = await response.json(); // Type the response
      const suggestions = data.predictions.map((prediction) => ({
        description: prediction.description,
        latitude: prediction.geometry.location.lat,
        longitude: prediction.geometry.location.lng,
      }));

      setSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  // Function to calculate distance between origin and destination
  const calculateDistance = async () => {
    setDistance("Calculating...");
    if (!originCoords || !destinationCoords) {
      console.error("Both origin and destination coordinates are required");
      return;
    }

    const origin = `${originCoords.lat},${originCoords.lng}`;
    const destination = `${destinationCoords.lat},${destinationCoords.lng}`;

    try {
      const response = await fetch(
        `/api/distance-matrix?origin=${origin}&destination=${destination}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Error fetching distance:",
          response.statusText,
          errorText
        );
        setDistance("Error calculating distance");
        return;
      }
      const data = await response.json();

      const distanceInMeters = data.rows[0].elements[0].distance;
      const distanceInKm = (distanceInMeters / 1000).toFixed(2); // Convert and round to 2 decimals
      setDistance(`${distanceInKm} km`);

      // Decode polyline for route display
      const routePolyline = data.rows[0].elements[0].polyline;
      const decodedPolyline = polyline.decode(routePolyline);
      setRouteCoordinates(decodedPolyline);
    } catch (error) {
      console.error("Fetch error:", error);
      setDistance("Error calculating distance");
    }
  };

  // Map click handler to capture origin/destination
  const MapClickHandler = () => {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        const selectedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };

        if (clickCount === 0) {
          setOriginCoords(selectedCoords);
          setClickCount(1);
          reverseGeocode(selectedCoords, setOrigin);
        } else {
          setDestinationCoords(selectedCoords);
          setClickCount(0);
          reverseGeocode(selectedCoords, setDestination);
        }
      },
    });
    return null;
  };

  // Reverse geocode to get the name of the place
  const reverseGeocode = async (
    coords: { lat: number; lng: number },
    setLocation: (name: string) => void
  ) => {
    try {
      const response = await fetch(
        `/api/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`
      );
      const data = await response.json();
      setLocation(data.place_name || "Selected Location");
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      setLocation("Selected Location");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <div className={styles.inputGroup}>
          <input
            type="checkbox"
            onClick={setSameAsMyAddressOrigin}
            className={styles.checkbox}
          />
          <label>Same as my Address (Origin)</label>
          <input
            type="text"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            className={styles.input}
            placeholder="Enter origin"
            onFocus={() => setShowSuggestionsOrigin(true)}
          />
          {showSuggestionsOrigin && (
            <ul className={styles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => {
                    setOrigin(suggestion.description);
                    setOriginCoords({
                      lat: suggestion.latitude,
                      lng: suggestion.longitude,
                    });
                    setShowSuggestionsOrigin(false);
                  }}
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.inputGroup}>
          <input
            type="checkbox"
            onClick={setSameAsMyAddressDest}
            className={styles.checkbox}
          />
          <label>Same as my Address (Destination)</label>
          <input
            type="text"
            value={destination}
            onChange={(e) => {
              setDestination(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            className={styles.input}
            placeholder="Enter destination"
            onFocus={() => setShowSuggestionsDestination(true)}
          />
          {showSuggestionsDestination && (
            <ul className={styles.suggestionsList}>
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className={styles.suggestionItem}
                  onClick={() => {
                    setDestination(suggestion.description);
                    setDestinationCoords({
                      lat: suggestion.latitude,
                      lng: suggestion.longitude,
                    });
                    setShowSuggestionsDestination(false);
                  }}
                >
                  {suggestion.description}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={calculateDistance} className={styles.button}>
          Calculate Distance
        </button>
        <p className={styles.distanceText}>Distance: {distance || ""}</p>
      </div>

      <div className={styles.mapContainer}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          {originCoords && (
            <Marker position={[originCoords.lat, originCoords.lng]}>
              <Popup>Origin: {origin}</Popup>
            </Marker>
          )}
          {destinationCoords && (
            <Marker position={[destinationCoords.lat, destinationCoords.lng]}>
              <Popup>Destination: {destination}</Popup>
            </Marker>
          )}
          {routeCoordinates.length > 0 && (
            <Polyline positions={routeCoordinates} color="blue" />
          )}
          <MapClickHandler />
        </MapContainer>
      </div>
    </div>
  );
};

export default DistanceCalculator;

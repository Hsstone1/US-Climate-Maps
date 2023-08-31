export const getGeolocate = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const geocoder = new google.maps.Geocoder();
  const latlng = { lat: latitude, lng: longitude };
  const numDecimals = 2; // Number of decimal places to display for lat/long

  try {
    const response = await geocoder.geocode({ location: latlng });
    if (response.results[0]) {
      const components = response.results[0].address_components;
      let locality, state, country;

      for (const component of components) {
        if (component.types.includes("locality")) {
          locality = component.long_name;
        } else if (component.types.includes("administrative_area_level_1")) {
          state = component.long_name;
        } else if (component.types.includes("country")) {
          country = component.short_name;
        }
      }

      const formattedAddress = [locality, state, country !== "US" && country]
        .filter(Boolean)
        .join(", ");

      if (formattedAddress.length === 0) {
        return `${latitude.toFixed(numDecimals)}, ${longitude.toFixed(
          numDecimals
        )}`;
      }

      return formattedAddress;
    } else {
      return `${latitude.toFixed(numDecimals)}, ${longitude.toFixed(
        numDecimals
      )}`;
    }
  } catch (error) {
    console.log("Geocoder failed due to: " + error);
    throw error;
  }
};

export const getElevation = async (
  latitude: number,
  longitude: number
): Promise<number> => {
  const elevationService = new google.maps.ElevationService();
  const latlng = new google.maps.LatLng(latitude, longitude);

  return new Promise<number>((resolve, reject) => {
    elevationService.getElevationForLocations(
      { locations: [latlng] },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const elevationInFeet = results[0].elevation * 3.28;
          resolve(elevationInFeet);
        } else {
          console.error("Elevation request failed:", status);
          resolve(0);
          reject(new Error("Elevation request failed"));
        }
      }
    );
  });
};

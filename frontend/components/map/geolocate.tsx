export const getGeolocate = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const geocoder = new google.maps.Geocoder();
  const latlng = { lat: latitude, lng: longitude };

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

      const formattedAddress = [locality, state, country]
        .filter(Boolean)
        .join(", ");

      if (formattedAddress.length === 0) {
        return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
      }

      return formattedAddress;
    } else {
      return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
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

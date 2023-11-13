import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import { useEffect } from "react";

type SearchBarProps = {
  setMarker: (position: google.maps.LatLngLiteral) => void;
};

export default function SearchBar({ setMarker }: SearchBarProps) {
  /*
    ready - is script ready to be used. Should always be yes due to checking in index.tsx
    value - value user entered in input
    setValue - change value each time user types something
    suggestions - values contained in each suggestion
    clearSuggestions - clear the suggestions when user selects something
    */

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  /* 
  Called when user clicks on a suggestion

  Sets value in search bar to clicked suggestion, then clears the list of suggestions
  Furthermore, converts the clicked item to a latlng pair via geocoding
  */
  const handleSelect = async (val: string) => {
    setValue(val, false);
    clearSuggestions();

    const results = await getGeocode({ address: val });
    const { lat, lng } = await getLatLng(results[0]);
    setMarker({ lat, lng });
  };

  return (
    <Combobox onSelect={handleSelect} className="combobox">
      <ComboboxInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        className="combobox-input"
        placeholder="Search an address"
      />
      <ComboboxPopover>
        <ComboboxList>
          {status === "OK" &&
            data
              .filter(({ description }) => description.includes("USA"))
              .map(({ place_id, description }) => (
                <ComboboxOption key={place_id} value={description} />
              ))}
        </ComboboxList>
      </ComboboxPopover>
    </Combobox>
  );
}

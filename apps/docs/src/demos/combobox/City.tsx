import { ComboBox, ComboBoxItem } from "@rasterdesign/react";

const CITIES = ["Basel", "Bern", "Biel/Bienne", "Geneva", "Lausanne", "Lucerne", "Lugano", "St. Gallen", "Winterthur", "Zürich"];

export default function City() {
  return (
    <ComboBox label="City" placeholder="Type to filter" description="Studios in ten Swiss cities.">
      {CITIES.map((city) => (
        <ComboBoxItem key={city} id={city}>
          {city}
        </ComboBoxItem>
      ))}
    </ComboBox>
  );
}

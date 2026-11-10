import { LineChart } from "@rasterdesign/react";
import { visitors } from "./Visitors";

export default function Highlighted() {
  return <LineChart {...visitors} caption="Zürich against the other venues" highlight="zurich" />;
}

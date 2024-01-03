import React, { useState } from "react";

type ToggleComponentProps = {
  children: JSX.Element[];
  labels: string[];
};

export default function ClimateChartRadio({
  children,
  labels,
}: ToggleComponentProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        {labels.map((label, index) => (
          <label key={label} style={{ display: "block", marginRight: "1em" }}>
            <input
              type="radio"
              value={label}
              checked={selectedIndex === index}
              onChange={() => setSelectedIndex(index)}
            />
            {label}
          </label>
        ))}
      </div>

      <div>{children[selectedIndex]}</div>
    </div>
  );
}

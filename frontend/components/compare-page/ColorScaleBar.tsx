type ColorScaleBarProps = {
  yearPercentDev?: number;
};

export const ColorScaleBar = ({ yearPercentDev = 50 }: ColorScaleBarProps) => {
  // Assuming yearPercentDev is available in the scope
  const tickStep = yearPercentDev / 2; // Adjust this to change the number of ticks

  const generateTicks = () => {
    let ticks = [];
    for (let i = -yearPercentDev; i <= yearPercentDev; i += tickStep) {
      ticks.push({
        label: `${i}%`,
        position: `${((i + yearPercentDev) / (2 * yearPercentDev)) * 100}%`,
      });
    }
    return ticks;
  };

  const ticks = generateTicks();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginTop: "0px",
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(to right, #8B0000 0%, white 50%, #006400 100%)",
          width: "100%",
          height: "5px",
          position: "relative",
        }}
      >
        {ticks.map((tick) => (
          <div
            key={tick.label}
            style={{
              position: "absolute",
              left: tick.position,
              bottom: "-15px", // Adjust as needed for visibility
              transform: "translateX(-50%)",
              fontSize: "10px",
            }}
          >
            {tick.label}
          </div>
        ))}
      </div>
    </div>
  );
};

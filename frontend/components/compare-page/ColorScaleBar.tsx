type ColorScaleBarProps = {
  colorPercentDev?: number;
};

export const ColorScaleBar = ({ colorPercentDev = 50 }: ColorScaleBarProps) => {
  // Assuming colorPercentDev is available in the scope
  const tickStep = colorPercentDev / 2; // Adjust this to change the number of ticks

  const generateTicks = () => {
    let ticks = [];
    for (let i = -colorPercentDev; i <= colorPercentDev; i += tickStep) {
      ticks.push({
        label: `${i}%`,
        position: `${((i + colorPercentDev) / (2 * colorPercentDev)) * 100}%`,
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

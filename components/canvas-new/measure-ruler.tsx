const MeasureRuler = () => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "20px",
          background: "white",
          borderBottom: "1px solid #ccc",
          display: "flex",
          alignItems: "flex-end",
          paddingLeft: "20px",
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              width: "100px",
              height: "100%",
              borderRight: "1px solid #ccc",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              paddingRight: "5px",
              fontSize: "10px",
            }}
          >
            {(i + 1) * 100}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 0,
          bottom: 0,
          width: "20px",
          background: "white",
          borderRight: "1px solid #ccc",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          paddingTop: "20px",
        }}
      >
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            style={{
              height: "100px",
              width: "100%",
              borderBottom: "1px solid #ccc",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              paddingTop: "5px",
              fontSize: "10px",
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            {(i + 1) * 100}
          </div>
        ))}
      </div>
    </>
  );
};

export default MeasureRuler;

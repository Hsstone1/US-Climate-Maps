import React, { createContext, useState, useContext } from "react";

interface ZoomContextType {
  zoomLevel: any;
  setZoomLevel: React.Dispatch<React.SetStateAction<any>>;
}

const ZoomContext = createContext<ZoomContextType | undefined>(undefined);

export const ZoomProvider: React.FC = ({ children }) => {
  const [zoomLevel, setZoomLevel] = useState({ xMin: 0, xMax: 364 });

  return (
    <ZoomContext.Provider value={{ zoomLevel, setZoomLevel }}>
      {children}
    </ZoomContext.Provider>
  );
};

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error("useZoom must be used within a ZoomProvider");
  }
  return context;
};

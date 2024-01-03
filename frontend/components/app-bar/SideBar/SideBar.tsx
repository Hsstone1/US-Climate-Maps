import { useState } from "react";
import LocationCard from "../LocationCard/LocationCard"; // Adjust the import path as needed
import { MarkerType } from "../../global-utils";

type SidebarProps = {
  locations: MarkerType[]; // Assuming LocationCardProps is imported from LocationCard component
  onRemoveLocation: (marker: MarkerType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
};

const Sidebar = ({
  locations,
  onRemoveLocation,
  isOpen,
  toggleSidebar,
}: SidebarProps) => {
  function handleAddRemove(location: MarkerType): void {
    console.log("Add/Remove");
  }

  function handleDelete(location: MarkerType): void {
    onRemoveLocation(location);
    console.log("Delete");
  }

  return (
    <div>
      <div
        className={`sidebar-backdrop ${isOpen ? "open" : ""}`}
        onClick={toggleSidebar}
      ></div>
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <h2>Compare Locations</h2>
          <hr />
          {locations.map((location, index) => (
            <LocationCard
              location={location}
              onAddRemove={() => handleAddRemove(location)}
              onDelete={() => handleDelete(location)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

import ClimateTable from "./climatetable";
import { MarkerType } from "../export-props";
type ClimateTableProps = {
  locations: MarkerType[];
};

export default function ClimateTablePaginate({ locations }: ClimateTableProps) {
  return (
    <div>
      <ClimateTable data={locations[0].data}></ClimateTable>
    </div>
  );
}

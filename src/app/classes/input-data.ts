import {DataFrame, IDataFrame} from "data-forge";

export class InputData {
  data: IDataFrame = new DataFrame()
  fileName: string = ""
  cols: any = {}
}

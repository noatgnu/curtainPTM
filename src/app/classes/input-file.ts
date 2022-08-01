import {DataFrame, IDataFrame} from "data-forge";

export class InputFile {
  df: IDataFrame = new DataFrame();
  filename: string = "";
  other: any = {};
  originalFile: string = "";
  constructor(df?: IDataFrame, filename?: string, originalFile?: string, other?: any) {
    if (df) {
      this.df = df;
    }
    if (filename) {
      this.filename = filename;
    }
    if (originalFile) {
      this.originalFile = originalFile;
    }
    this.other = other;

  }
}

import {Project} from "./project";

export class Settings {
  fetchUniprot: boolean = true
  inputDataCols: any = {}
  probabilityFilterMap: any = {}
  pCutoff: number = 0.05
  log2FCCutoff: number = 0.6
  description: string = ""
  uniprot: boolean = true
  colorMap: any = {}
  academic: boolean = true
  backGroundColorGrey: boolean = false
  currentComparison: string = ""
  version: number = 2
  currentID: string = ""
  fdrCurveText: string = ""
  fdrCurveTextEnable: boolean = false
  project: Project = new Project()
  sampleOrder: any = {}
  sampleVisible: any = {}
  conditionOrder: string[] = []
  volcanoAxis: any = {minX: null, maxX: null, minY: null, maxY: null}
  barchartColorMap: any = {}
  textAnnotation: any = {}
}

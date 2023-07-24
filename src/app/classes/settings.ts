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
  volcanoPlotTitle: string = ""
  visible: any = {}
  defaultColorList: string[] = [
    "#fd7f6f",
    "#7eb0d5",
    "#b2e061",
    "#bd7ebe",
    "#ffb55a",
    "#ffee65",
    "#beb9db",
    "#fdcce5",
    "#8bd3c7",
  ]
  variantCorrection: any = {}
  customSequences: any = {}
  scatterPlotMarkerSize: number = 10
  stringDBColorMap: any = {
    "Increase": "#8d0606",
    "Decrease": "#4f78a4",
    "In dataset": "#ce8080",
    "Not in dataset": "#676666"
  }
  interactomeAtlasColorMap: any = {
    "Increase": "#a12323",
    "Decrease": "#16458c",
    "No change": "rgba(47,39,40,0.96)",
    "HI-Union": "rgba(82,110,194,0.96)",
    "Literature": "rgba(181,151,222,0.96)",
    "HI-Union and Literature": "rgba(222,178,151,0.96)",
  }
  proteomicsDBColor: string = "#ff7f0e"
  networkInteractionSettings: any = {
    "Increase": "rgba(220,169,0,0.96)",
    "Decrease": "rgba(220,0,59,0.96)",
    "StringDB": "rgb(206,128,128)",
    "No change": "rgba(47,39,40,0.96)",
    "Not significant": "rgba(255,255,255,0.96)",
    "Significant": "rgba(252,107,220,0.96)",
    "InteractomeAtlas": "rgb(73,73,101)",
  }
  plotFontFamily: string = "Arial"
  networkInteractionData: any[] = []
}

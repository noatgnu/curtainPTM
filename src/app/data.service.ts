import { Injectable, signal } from '@angular/core';
import {InputFile} from "./classes/input-file";
import {Raw} from "./classes/raw";
import {Differential} from "./classes/differential";
import {DataFrame, IDataFrame} from "data-forge";
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction} from "rxjs";
import {SettingsService} from "./settings.service";
import {UniprotService} from "./uniprot.service";
import {loadFromLocalStorage} from "curtain-web-api";

export interface AnnotationEvent {
  id: string | string[];
  remove: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  draftDataCiteCount: number = 0
  bypassUniProt: boolean = false
  instructorMode: boolean = false

  private readonly _loadDataTrigger = signal(0);
  readonly loadDataTrigger = this._loadDataTrigger.asReadonly();

  session: any = {}
  tempLink: boolean = false

  private readonly _dataClear = signal(0);
  readonly dataClear = this._dataClear.asReadonly();

  readonly finishedProcessing = signal(false);

  private readonly _selectionUpdateTrigger = signal(0);
  readonly selectionUpdateTrigger = this._selectionUpdateTrigger.asReadonly();

  private readonly _restoreTrigger = signal(0);
  readonly restoreTrigger = this._restoreTrigger.asReadonly();

  readonly annotationEvent = signal<AnnotationEvent | null>(null);

  readonly batchAnnotate = signal<AnnotationEvent | null>(null);

  private readonly _updateVariantCorrection = signal(0);
  readonly updateVariantCorrection = this._updateVariantCorrection.asReadonly();

  readonly searchCommand = signal<any>(null);

  raw: InputFile = new InputFile()
  rawForm: Raw = new Raw()
  differential: InputFile = new InputFile()
  differentialForm: Differential = new Differential()
  dataMap: Map<string, string> = new Map<string, string>()
  sampleMap: any = {}
  conditions: string[] = []

  private readonly _resetVolcanoColor = signal(0);
  readonly resetVolcanoColor = this._resetVolcanoColor.asReadonly();

  private readonly _volcanoShapesChanged = signal(0);
  readonly volcanoShapesChanged = this._volcanoShapesChanged.asReadonly();

  readonly downloadProgress = signal(0);

  readonly uploadProgress = signal(0);

  readonly processingProgress = signal(0);

  minMax = {
    fcMin: 0,
    fcMax: 0,
    pMin: 0,
    pMax: 0
  }
  dataTestTypes: string[] = [
    "ANOVA",
    "TTest"
  ]
  palette: any = {
    "pastel": [
      "#fd7f6f",
      "#7eb0d5",
      "#b2e061",
      "#bd7ebe",
      "#ffb55a",
      "#ffee65",
      "#beb9db",
      "#fdcce5",
      "#8bd3c7"
    ], "retro": [
      "#ea5545",
      "#f46a9b",
      "#ef9b20",
      "#edbf33",
      "#ede15b",
      "#bdcf32",
      "#87bc45",
      "#27aeef",
      "#b33dc6"
    ],
    "solid": [
      '#1f77b4',
      '#ff7f0e',
      '#2ca02c',
      '#d62728',
      '#9467bd',
      '#8c564b',
      '#e377c2',
      '#7f7f7f',
      '#bcbd22',
      '#17becf'
    ],
    "gradient_red_to_green": [
      "#ff0000",
      "#ff3300",
      "#ff6600",
      "#ff9900",
      "#ffcc00",
      "#ffff00",
      "#ccff00",
      "#99ff00",
      "#66ff00",
      "#33ff00",
      "#00ff00"
    ],
    "Tol_bright": [
      '#EE6677',
      '#228833',
      '#4477AA',
      '#CCBB44',
      '#66CCEE',
      '#AA3377',
      '#BBBBBB'
    ],
    "Tol_muted": [
      '#88CCEE',
      '#44AA99',
      '#117733',
      '#332288',
      '#DDCC77',
      '#999933',
      '#CC6677',
      '#882255',
      '#AA4499',
      '#DDDDDD'
    ],
    "Tol_light": [
      '#BBCC33',
      '#AAAA00',
      '#77AADD',
      '#EE8866',
      '#EEDD88',
      '#FFAABB',
      '#99DDFF',
      '#44BB99',
      '#DDDDDD'
    ],
    "Okabe_Ito": [
      "#E69F00",
      "#56B4E9",
      "#009E73",
      "#F0E442",
      "#0072B2",
      "#D55E00",
      "#CC79A7",
      "#000000"
    ]
  }

  currentDF: IDataFrame = new DataFrame()
  accessionToPrimaryIDs: any = {}
  primaryIDsList: string[] = []
  accessionList: string[] = []
  accessionMap: any = {}
  fetchUniProt: boolean = true
  genesMap: any = {}
  allGenes: string[] = []
  selected: string[] = []
  selectedGenes: string[] = []
  selectedAccessions: string[] = []
  selectedResults: any = {}
  annotatedData: any = {}
  annotatedMap: any = {}
  selectedMap: any = {}
  selectOperationNames: string[] = []
  searchType: string = "Gene Names"
  page: number = 1
  pageSize: number = 5
  dbIDMap: any = {}
  public_key: CryptoKey|undefined = undefined
  private_key: CryptoKey|undefined = undefined

  defaultColorList = [
    "#fd7f6f",
    "#7eb0d5",
    "#b2e061",
    "#bd7ebe",
    "#ffb55a",
    "#ffee65",
    "#beb9db",
    "#fdcce5",
    "#8bd3c7"
  ]

  private readonly _redrawTrigger = signal(0);
  readonly redrawTrigger = this._redrawTrigger.asReadonly();

  colorMap: any = {}

  constructor(private settings: SettingsService, private uniprot: UniprotService) { }

  triggerLoadData(): void {
    this._loadDataTrigger.update(v => v + 1);
  }

  triggerDataClear(): void {
    this._dataClear.update(v => v + 1);
  }

  triggerSelectionUpdate(): void {
    this._selectionUpdateTrigger.update(v => v + 1);
  }

  triggerRestore(): void {
    this._restoreTrigger.update(v => v + 1);
  }

  triggerUpdateVariantCorrection(): void {
    this._updateVariantCorrection.update(v => v + 1);
  }

  triggerResetVolcanoColor(): void {
    this._resetVolcanoColor.update(v => v + 1);
  }

  triggerVolcanoShapesChange(): void {
    this._volcanoShapesChanged.update(v => v + 1);
  }

  triggerRedraw(): void {
    this._redrawTrigger.update(v => v + 1);
  }

  clear() {
    this.selected = []
    this.selectedGenes = []
    this.selectedMap = {}
    this.selectOperationNames = []
    this.settings.settings.colorMap = {}
    this.selectedAccessions = []
    this.settings.settings.textAnnotation = {}
    this.settings.settings.barchartColorMap = {}
    this.annotatedData = {}
    this.settings.settings.volcanoAdditionalShapes = []
    this.triggerDataClear()
  }

  significantGroup(x: number, y: number) {
    const ylog = -Math.log10(this.settings.settings.pCutoff)
    const groups: string[] = []
    let position = ""
    if (ylog > y) {
      groups.push("P-value > " + this.settings.settings.pCutoff)
      position = "P-value > "
    } else {
      groups.push("P-value <= " + this.settings.settings.pCutoff)
      position = "P-value <= "
    }

    if (Math.abs(x) > this.settings.settings.log2FCCutoff) {
      groups.push("FC > " + this.settings.settings.log2FCCutoff)
      position += "FC > "
    } else {
      groups.push("FC <= " + this.settings.settings.log2FCCutoff)
      position += "FC <= "
    }

    return [groups.join(";"), position]
  }

  getPrimaryFromGeneNames(geneNames: string) {
    const result: string[] = []
    if (this.uniprot.geneNameToPrimary[geneNames]) {
      for (const a in this.uniprot.geneNameToPrimary[geneNames]) {
        if (!result.includes(a)) {
          result.push(a)
        }
      }
    }
    return result
  }

  getPrimaryFromAcc(acc: string) {
    const result: string[] = []
    if (this.accessionToPrimaryIDs[acc]) {
      for (const pr in this.accessionToPrimaryIDs[acc]) {
        if (!result.includes(pr)) {
          result.push(pr)
        }
      }
    }
    return result
  }

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilter(term, this.searchType))
    )

  searchFilter(term: string, searchType: string) {
    switch (searchType) {
      case "Gene Names":
        return this.allGenes.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Accession IDs":
        return this.accessionList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Primary IDs":
        return this.primaryIDsList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      default:
        return [""]
    }
  }

  searchLimited: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilterLimited(term, this.searchType))
    )

  searchFilterLimited(term: string, searchType: string) {
    switch (searchType) {
      case "Gene Names":
        return this.selectedGenes.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Accession IDs":
        return this.selectedAccessions.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Primary IDs":
        return this.selected.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      default:
        return [""]
    }
  }

  async getKey() {
    this.private_key = await loadFromLocalStorage("private")
    this.public_key = await loadFromLocalStorage("public")
  }

  mergeSearchOperation(searchOperations: string[], newSearchOperationName: string, color: string = "") {
    for (const i in this.selectedMap) {
      for (const j in this.selectedMap[i]) {
        if (searchOperations.includes(j)) {
          this.selectedMap[i][newSearchOperationName] = true
        }
      }
    }
    this.selectOperationNames.push(newSearchOperationName)
    if (color !== "") {
      this.settings.settings.colorMap[newSearchOperationName] = color
    } else {
      this.settings.settings.colorMap[newSearchOperationName] = this.defaultColorList[0]
    }
  }
}

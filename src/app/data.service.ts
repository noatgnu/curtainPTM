import { Injectable } from '@angular/core';
import {InputFile} from "./classes/input-file";
import {Raw} from "./classes/raw";
import {Differential} from "./classes/differential";
import {DataFrame, IDataFrame} from "data-forge";
import {BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, OperatorFunction, Subject} from "rxjs";
import {SettingsService} from "./settings.service";
import {UniprotService} from "./uniprot.service";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  loadDataTrigger: Subject<boolean> = new Subject<boolean>()
  session: any = {}
  tempLink: boolean = false
  dataClear: Subject<boolean> = new Subject()
  finishedProcessingData: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  selectionUpdateTrigger: Subject<boolean> = new Subject<boolean>()
  restoreTrigger: Subject<boolean> = new Subject<boolean>()
  annotationService: Subject<any> = new Subject<any>()
  batchAnnotateAnnoucement: Subject<any> = new Subject<any>()
  updateVariantCorrection: Subject<boolean> = new Subject<boolean>()
  searchCommandService: Subject<any> = new Subject<any>()
  raw: InputFile = new InputFile()
  rawForm: Raw = new Raw()
  differential: InputFile = new InputFile()
  differentialForm: Differential = new Differential()
  dataMap: Map<string, string> = new Map<string, string>()
  sampleMap: any = {}
  conditions: string[] = []
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
  /*defaultColorList = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf']*/
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
  redrawTrigger: Subject<boolean> = new Subject()
  colorMap: any = {}
  constructor(private settings: SettingsService, private uniprot: UniprotService) { }

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
  }

  significantGroup(x: number, y: number) {
    const ylog = -Math.log10(this.settings.settings.pCutoff)
    const groups: string[] = []
    if (ylog > y) {
      groups.push("P-value > " + this.settings.settings.pCutoff)
    } else {
      groups.push("P-value <= " + this.settings.settings.pCutoff)
    }

    if (Math.abs(x) > this.settings.settings.log2FCCutoff) {
      groups.push("FC > " + this.settings.settings.log2FCCutoff)
    } else {
      groups.push("FC <= " + this.settings.settings.log2FCCutoff)
    }

    return groups.join(";")
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


}

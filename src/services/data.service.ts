import { Injectable } from '@angular/core';
import {SettingsService} from "./settings.service";
import {InputData} from "../app/classes/input-data";
import {BehaviorSubject, Subject} from "rxjs";
import {PlotlyService} from "angular-plotly.js";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  highlightMap: any = {}
  _cols: any = {}
  _dataFile: InputData = new InputData()
  _conditionMap: any = {}
  selectionService: Subject<any> = new Subject<any>()
  set dataFile(value: InputData) {
    this._dataFile = value
  }
  get dataFile() : InputData {
    return this._dataFile
  }
  _rawDataFile: InputData = new InputData()
  set rawDataFile(value: InputData) {
    this._rawDataFile = value
  }
  get rawDataFile() : InputData {
    return this._rawDataFile
  }
  selected = ["LRRK2"]
  geneList: string[] = []
  accList: string[] = []
  primaryIDsList: string[] = []
  dataMap: Map<string, string> = new Map<string, string>()
  queryProtein: string[] = []
  queryMap: Map<string, any> = new Map<string, any>()
  clearSelections: Subject<boolean> = new Subject<boolean>()
  restoreTrigger: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  finishedProcessing: boolean = false
  observableTriggerMap: any = {}
  highlights: any = {}
  pspIDMap: any = {}
  justSelected: string = ""
  set cols(value: any) {
    this._cols = value
    this.settings.settings.inputDataCols = value
  }
  get cols(): any {
    return this._cols
  }
  aaList = [
    { res: "A"},
    { res: "B"},
    { res: "C"},
    { res: "D"},
    { res: "E"},
    { res: "F"},
    { res: "G"},
    { res: "H"},
    { res: "I"},
    { res: "K"},
    { res: "L"},
    { res: "M"},
    { res: "N"},
    { res: "P"},
    { res: "Q"},
    { res: "R"},
    { res: "S"},
    { res: "T"},
    { res: "V"},
    { res: "W"},
    { res: "Y"},
    { res: "Z"}
  ]
  selectionNotifier: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  constructor(private settings: SettingsService, private plotly: PlotlyService) { }

  async downloadPlotlyExtra(id: string, format: string = "svg") {
    const graph = this.plotly.getInstanceByDivId(id);
    const p = await this.plotly.getPlotly();
    await p.downloadImage(graph, {format: format, width: 1000, height: 1000, filename: "image"})
  }

  addSelected(primaryIDs: string) {
    if (this.highlights[primaryIDs]) {
      this.highlights[primaryIDs].selected = true
    } else {
      this.highlights[primaryIDs] = {selected: true}
    }
  }

  removeSelected(primaryIDs: string) {
    if (this.highlights[primaryIDs]) {
      this.highlights[primaryIDs].selected = false
    } else {
      this.highlights[primaryIDs] = {selected: false}
    }
  }
  scrollToID(id: string) {
    let e = document.getElementById(id)
    if (e) {
      e.scrollIntoView()
    } else {
      let observer = new MutationObserver(mutations => {
        mutations.forEach(function (mutation) {
          let nodes = Array.from(mutation.addedNodes)
          for (const node of nodes) {
            if (node.contains(document.getElementById(id))) {
              e = document.getElementById(id)
              if (e) {
                e.scrollIntoView()
              }
              observer.disconnect()
              break
            }
          }
        })
      })
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      })
    }
    return e;
  }
  annotateService: Subject<any> = new Subject<any>()
  progressBarEvent: Subject<any> = new Subject<any>()

  getFrequencyAA(seq: string) {
    const aas: any = {}
    for (const a of this.aaList) {
      aas[a.res] = []
    }

    for (const s of seq) {
      if (aas[s]) {
        for (const a of this.aaList) {
          if (s === a.res) {
            aas[s].push(1)
          } else {
            aas[s].push(0)
          }
        }
      } else {
        for (const a of this.aaList) {
          aas[a.res].push(0)
        }
      }

    }
    return aas
  }

  getFrequencyMultiple(seqs: string[]) {
    const result: any[] = []
    const windowLength: number = seqs[0].length
    for (let i = 0; i < this.aaList.length; i ++) {
      result.push([])
      for (const a of seqs[0]) {
        result[i].push(0)
      }
    }
    for (const s of seqs) {
      const f = this.getFrequencyAA(s)
      for (let i = 0; i < this.aaList.length; i ++) {
        for (let i2 = 0; i2 < windowLength; i2 ++) {
          result[i][i2] += f[this.aaList[i].res]
        }
      }
    }
    return result
  }
}

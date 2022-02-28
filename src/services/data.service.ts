import { Injectable } from '@angular/core';
import {SettingsService} from "./settings.service";
import {InputData} from "../app/classes/input-data";
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DataService {
  _cols: any = {}
  _dataFile: InputData = new InputData()
  _conditionMap: any = {}
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
  restoreTrigger: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  finishedProcessing: boolean = false
  observableTriggerMap: any = {}
  set cols(value: any) {
    this._cols = value
    this.settings.settings.inputDataCols = value
  }
  get cols(): any {
    return this._cols
  }

  selectionNotifier: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false)
  constructor(private settings: SettingsService) { }
}

import { Injectable } from '@angular/core';
import {SettingsService} from "./settings.service";
import {DataService} from "./data.service";

@Injectable({
  providedIn: 'root'
})
export class SaveStateService {

  states: number[] = []
  constructor(private settings: SettingsService, private data: DataService) {
    this.states = this.getAvailableStates()
  }

  saveState() {
    const settings: any = Object.assign({}, this.settings.settings)
    const data: any = {
      selectedMap : this.data.selectedMap,
      selected : this.data.selected,
      selectOperationNames : this.data.selectOperationNames,
    }

    let stateNumber = localStorage.getItem("SaveStateNumber")
    if (!stateNumber) {
      localStorage.setItem("SaveStateNumber", "0")
      stateNumber = "0"
    }
    const state: any = {
      settings, data, currentID: this.settings.settings.currentID, selectedComparison: this.data.differentialForm.comparisonSelect, date: Date.now(), id: stateNumber
    }
    localStorage.setItem("SaveState"+stateNumber, JSON.stringify(state))
    localStorage.setItem("SaveStateNumber", (parseInt(stateNumber)+1).toString())
    this.states = this.getAvailableStates()
    return stateNumber
  }

  createNewState() {
    const settings: any = {}
    const data: any = {
      selectedMap : this.data.selectedMap,
      selected : this.data.selected,
      selectOperationNames : this.data.selectOperationNames,
    }
    for (const s in this.settings.settings) {
      if (s !== "currentID"){
        // @ts-ignore
        settings[s] = this.settings.settings[s]
      }
    }
    const state: any = {
      settings, data, currentID: this.settings.settings.currentID, selectedComparison: this.data.differentialForm.comparisonSelect, date: Date.now(), id: "X"
    }
    return state
  }

  loadState(stateNumber: number) {
    const state: string|null = localStorage.getItem("SaveState"+stateNumber)
    let loadedState: any = {}
    if (state) {
      loadedState = JSON.parse(state)
    }
    console.log(state)
    console.log(loadedState)
    this.data.clear()
    this.data.selectedMap = loadedState.data.selectedMap
    this.data.selected = loadedState.data.selected
    this.data.selectOperationNames = loadedState.data.selectOperationNames

    for (const s in loadedState.settings) {
      if (s in this.settings.settings && s !== "currentID"){
        // @ts-ignore
        this.settings.settings[s] = state.settings[s]
      }
    }

    this.data.loadDataTrigger.next(true)

  }

  getAvailableStates() {
    const stateNumber = localStorage.getItem("SaveStateNumber")
    const states: number[] = []
    if(stateNumber) {
      for (let i = 0; i < parseInt(stateNumber); i++) {
        if (localStorage.getItem("SaveState"+i)) {
          states.push(i)
        }
      }
    }
    return states
  }

  removeState(stateNumber: number) {
    localStorage.removeItem("SaveState"+stateNumber)
    this.states = this.getAvailableStates()
  }

  removeAllStates() {
    const stateNumber = localStorage.getItem("SaveStateNumber")
    if(stateNumber) {
      for (let i = 0; i < parseInt(stateNumber); i++) {
        localStorage.removeItem("SaveState"+i)
      }
    }
    localStorage.removeItem("SaveStateNumber")
    this.states = []
  }

  getSaveState(stateNumber: number) {
    const state: string|null = localStorage.getItem("SaveState"+stateNumber)
    let loadedState: any = {}
    if (state) {
      loadedState = JSON.parse(state)
    }
    return loadedState
  }

  loadStateFromObject(state: any) {
    this.data.clear()
    this.data.selectedMap = state.data.selectedMap
    this.data.selected = state.data.selected
    this.data.selectOperationNames = state.data.selectOperationNames

    for (const s in state.settings) {
      if (s in this.settings.settings && s !== "currentID"){
        // @ts-ignore
        this.settings.settings[s] = state.settings[s]
      }
    }

    this.data.loadDataTrigger.next(true)
  }

  downloadState(stateNumber: number) {
    const state: string|null = localStorage.getItem("SaveState"+stateNumber)
    if (state){
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(state);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href",     dataStr     );
      dlAnchorElem.setAttribute("download", "SaveState"+stateNumber+".json");
      dlAnchorElem.click();
    }
  }
}

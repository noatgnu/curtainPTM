import { Injectable } from '@angular/core';
import { SettingsService } from "./settings.service";
import { DataService } from "./data.service";
import { AutoSaveService } from "./auto-save.service";
import { StateMigrationService } from "./state-migration.service";
import {
  SavedState,
  StateCategory,
  StatePreview,
  CategorySummary,
  ExportOptions,
  STATE_CATEGORIES,
  CURRENT_STATE_VERSION
} from './interfaces/saved-state.interface';

@Injectable({
  providedIn: 'root'
})
export class SaveStateService {
  states: number[] = [];
  private autoSaveKeys: string[] = [];

  constructor(
    private settings: SettingsService,
    private data: DataService,
    private autoSave: AutoSaveService,
    private migration: StateMigrationService
  ) {
    this.migration.migrateOldStates();
    this.states = this.getAvailableStates();
    this.loadAutoSaveKeys();
    this.setupAutoSave();
  }

  private setupAutoSave(): void {
    this.autoSave.autoSaveTrigger.subscribe(() => {
      this.autoSaveState();
    });
  }

  private loadAutoSaveKeys(): void {
    const stored = localStorage.getItem('AutoSaveKeys');
    if (stored) {
      this.autoSaveKeys = JSON.parse(stored);
    }
  }

  private saveAutoSaveKeys(): void {
    localStorage.setItem('AutoSaveKeys', JSON.stringify(this.autoSaveKeys));
  }

  getSaveState(stateNumber: number): SavedState | null {
    const state: string | null = localStorage.getItem("SaveState" + stateNumber);
    if (state) {
      const parsed = JSON.parse(state);
      if (this.migration.isOldFormat(parsed)) {
        return this.migration.upgradeState(parsed, CURRENT_STATE_VERSION);
      }
      return parsed;
    }
    return null;
  }

  saveState(): string {
    return this.saveStateWithMetadata('', '', []);
  }

  saveStateWithMetadata(name: string, description: string, tags: string[]): string {
    const settings: any = Object.assign({}, this.settings.settings);
    const data: any = {
      selectedMap: this.data.selectedMap,
      selected: this.data.selected,
      selectOperationNames: this.data.selectOperationNames,
    };

    let stateNumber = localStorage.getItem("SaveStateNumber");
    if (!stateNumber) {
      localStorage.setItem("SaveStateNumber", "0");
      stateNumber = "0";
    }

    const stateName = name || `State #${stateNumber}`;

    const state: SavedState = {
      id: stateNumber,
      name: stateName,
      description: description,
      tags: tags,
      date: Date.now(),
      currentID: this.settings.settings.currentID,
      selectedComparison: this.data.differentialForm.comparisonSelect,
      isAutoSave: false,
      version: CURRENT_STATE_VERSION,
      settings,
      data
    };

    localStorage.setItem("SaveState" + stateNumber, JSON.stringify(state));
    localStorage.setItem("SaveStateNumber", (parseInt(stateNumber) + 1).toString());
    this.states = this.getAvailableStates();
    return stateNumber;
  }

  createSelectiveState(categories: string[]): SavedState {
    const settings: any = {};
    const data: any = {
      selectedMap: {},
      selected: [],
      selectOperationNames: [],
    };

    const selectedCategories = STATE_CATEGORIES.filter(c => categories.includes(c.key));

    for (const category of selectedCategories) {
      if (category.isDataCategory) {
        data.selectedMap = this.data.selectedMap;
        data.selected = this.data.selected;
        data.selectOperationNames = this.data.selectOperationNames;
      } else {
        for (const key of category.settingsKeys) {
          if (key in this.settings.settings) {
            settings[key] = (this.settings.settings as any)[key];
          }
        }
      }
    }

    return {
      id: 'selective',
      name: '',
      description: '',
      tags: [],
      date: Date.now(),
      currentID: this.settings.settings.currentID,
      selectedComparison: this.data.differentialForm.comparisonSelect,
      isAutoSave: false,
      version: CURRENT_STATE_VERSION,
      settings,
      data
    };
  }

  loadSelectiveState(state: SavedState, categories: string[]): void {
    const selectedCategories = STATE_CATEGORIES.filter(c => categories.includes(c.key));

    for (const category of selectedCategories) {
      if (category.isDataCategory) {
        if (state.data.selectedMap) {
          this.data.selectedMap = state.data.selectedMap;
        }
        if (state.data.selected) {
          this.data.selected = state.data.selected;
        }
        if (state.data.selectOperationNames) {
          this.data.selectOperationNames = state.data.selectOperationNames;
        }
      } else {
        for (const key of category.settingsKeys) {
          if (key in state.settings && key !== "currentID") {
            (this.settings.settings as any)[key] = (state.settings as any)[key];
          }
        }
      }
    }

    this.data.loadDataTrigger.next(true);
  }

  loadState(stateNumber: number): void {
    const state: string | null = localStorage.getItem("SaveState" + stateNumber);
    if (!state) return;

    let loadedState: SavedState = JSON.parse(state);
    if (this.migration.isOldFormat(loadedState)) {
      loadedState = this.migration.upgradeState(loadedState, CURRENT_STATE_VERSION);
    }

    this.data.clear();
    this.data.selectedMap = loadedState.data.selectedMap;
    this.data.selected = loadedState.data.selected;
    this.data.selectOperationNames = loadedState.data.selectOperationNames;

    for (const s in loadedState.settings) {
      if (s in this.settings.settings && s !== "currentID") {
        (this.settings.settings as any)[s] = (loadedState.settings as any)[s];
      }
    }

    this.data.loadDataTrigger.next(true);
  }

  getStatePreview(stateNumber: number): StatePreview | null {
    const state = this.getSaveState(stateNumber);
    if (!state) return null;

    const categorySummary: CategorySummary[] = STATE_CATEGORIES.map(category => {
      let itemCount = 0;
      let hasData = false;

      if (category.isDataCategory) {
        if (state.data.selectedMap) {
          itemCount = Object.keys(state.data.selectedMap).length;
        }
        hasData = itemCount > 0 || (state.data.selectOperationNames?.length || 0) > 0;
      } else {
        for (const key of category.settingsKeys) {
          if (key in state.settings) {
            const value = (state.settings as any)[key];
            if (value !== null && value !== undefined) {
              if (typeof value === 'object') {
                itemCount += Object.keys(value).length;
              } else {
                itemCount++;
              }
              hasData = true;
            }
          }
        }
      }

      return {
        category,
        itemCount,
        hasData
      };
    });

    const totalSettingsCount = Object.keys(state.settings).length;
    const selectionsCount = state.data.selectedMap
      ? Object.keys(state.data.selectedMap).length
      : 0;

    return {
      metadata: {
        id: state.id,
        name: state.name,
        description: state.description,
        tags: state.tags,
        date: state.date,
        currentID: state.currentID,
        selectedComparison: state.selectedComparison,
        isAutoSave: state.isAutoSave,
        version: state.version
      },
      categorySummary,
      totalSettingsCount,
      selectionsCount
    };
  }

  autoSaveState(): void {
    const settings: any = Object.assign({}, this.settings.settings);
    const data: any = {
      selectedMap: this.data.selectedMap,
      selected: this.data.selected,
      selectOperationNames: this.data.selectOperationNames,
    };

    const autoSaveKey = 'AutoSave_' + Date.now();

    const state: SavedState = {
      id: autoSaveKey,
      name: 'Auto-save',
      description: 'Automatic checkpoint',
      tags: ['auto-save'],
      date: Date.now(),
      currentID: this.settings.settings.currentID,
      selectedComparison: this.data.differentialForm.comparisonSelect,
      isAutoSave: true,
      version: CURRENT_STATE_VERSION,
      settings,
      data
    };

    localStorage.setItem(autoSaveKey, JSON.stringify(state));
    this.autoSaveKeys.push(autoSaveKey);
    this.pruneAutoSaves(this.autoSave.getMaxAutoSaves());
    this.saveAutoSaveKeys();
  }

  getAutoSaves(): SavedState[] {
    const autoSaves: SavedState[] = [];
    for (const key of this.autoSaveKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        autoSaves.push(JSON.parse(stored));
      }
    }
    return autoSaves.sort((a, b) => b.date - a.date);
  }

  pruneAutoSaves(keepCount: number): void {
    while (this.autoSaveKeys.length > keepCount) {
      const oldestKey = this.autoSaveKeys.shift();
      if (oldestKey) {
        localStorage.removeItem(oldestKey);
      }
    }
    this.saveAutoSaveKeys();
  }

  loadAutoSave(autoSaveKey: string): void {
    const stored = localStorage.getItem(autoSaveKey);
    if (!stored) return;

    const state: SavedState = JSON.parse(stored);
    this.data.clear();
    this.data.selectedMap = state.data.selectedMap;
    this.data.selected = state.data.selected;
    this.data.selectOperationNames = state.data.selectOperationNames;

    for (const s in state.settings) {
      if (s in this.settings.settings && s !== "currentID") {
        (this.settings.settings as any)[s] = (state.settings as any)[s];
      }
    }

    this.data.loadDataTrigger.next(true);
  }

  deleteAutoSave(autoSaveKey: string): void {
    const index = this.autoSaveKeys.indexOf(autoSaveKey);
    if (index > -1) {
      this.autoSaveKeys.splice(index, 1);
      localStorage.removeItem(autoSaveKey);
      this.saveAutoSaveKeys();
    }
  }

  getStatesByTag(tag: string): SavedState[] {
    const states: SavedState[] = [];
    for (const stateNum of this.states) {
      const state = this.getSaveState(stateNum);
      if (state && state.tags && state.tags.includes(tag)) {
        states.push(state);
      }
    }
    return states;
  }

  getAllTags(): string[] {
    const tags = new Set<string>();
    for (const stateNum of this.states) {
      const state = this.getSaveState(stateNum);
      if (state && state.tags) {
        state.tags.forEach(tag => tags.add(tag));
      }
    }
    return Array.from(tags).sort();
  }

  updateStateTags(stateId: string | number, tags: string[]): void {
    const stateKey = 'SaveState' + stateId;
    const stored = localStorage.getItem(stateKey);
    if (stored) {
      const state: SavedState = JSON.parse(stored);
      state.tags = tags;
      localStorage.setItem(stateKey, JSON.stringify(state));
    }
  }

  updateStateMetadata(stateId: string | number, name: string, description: string, tags: string[]): void {
    const stateKey = 'SaveState' + stateId;
    const stored = localStorage.getItem(stateKey);
    if (stored) {
      const state: SavedState = JSON.parse(stored);
      state.name = name;
      state.description = description;
      state.tags = tags;
      localStorage.setItem(stateKey, JSON.stringify(state));
    }
  }

  exportState(stateNumber: number, options: ExportOptions): string {
    const state = this.getSaveState(stateNumber);
    if (!state) return '';

    let exportData: SavedState;

    if (options.categories && options.categories.length > 0) {
      const selectiveState = this.createSelectiveStateFromExisting(state, options.categories);
      exportData = selectiveState;
    } else {
      exportData = state;
    }

    if (options.pretty) {
      return JSON.stringify(exportData, null, 2);
    }
    return JSON.stringify(exportData);
  }

  private createSelectiveStateFromExisting(state: SavedState, categories: string[]): SavedState {
    const settings: any = {};
    const data: any = {
      selectedMap: {},
      selected: [],
      selectOperationNames: [],
    };

    const selectedCategories = STATE_CATEGORIES.filter(c => categories.includes(c.key));

    for (const category of selectedCategories) {
      if (category.isDataCategory) {
        data.selectedMap = state.data.selectedMap;
        data.selected = state.data.selected;
        data.selectOperationNames = state.data.selectOperationNames;
      } else {
        for (const key of category.settingsKeys) {
          if (key in state.settings) {
            settings[key] = (state.settings as any)[key];
          }
        }
      }
    }

    return {
      ...state,
      settings,
      data
    };
  }

  getAvailableStates(): number[] {
    const stateNumber = localStorage.getItem("SaveStateNumber");
    const states: number[] = [];
    if (stateNumber) {
      for (let i = 0; i < parseInt(stateNumber); i++) {
        if (localStorage.getItem("SaveState" + i)) {
          states.push(i);
        }
      }
    }
    return states;
  }

  removeState(stateNumber: number): void {
    localStorage.removeItem("SaveState" + stateNumber);
    this.states = this.getAvailableStates();
  }

  removeAllStates(): void {
    const stateNumber = localStorage.getItem("SaveStateNumber");
    if (stateNumber) {
      for (let i = 0; i < parseInt(stateNumber); i++) {
        localStorage.removeItem("SaveState" + i);
      }
    }
    localStorage.removeItem("SaveStateNumber");
    this.states = [];
  }

  createNewState(): SavedState {
    const settings: any = {};
    const data: any = {
      selectedMap: this.data.selectedMap,
      selected: this.data.selected,
      selectOperationNames: this.data.selectOperationNames,
    };
    for (const s in this.settings.settings) {
      if (s !== "currentID") {
        settings[s] = (this.settings.settings as any)[s];
      }
    }
    return {
      id: "X",
      name: '',
      description: '',
      tags: [],
      date: Date.now(),
      currentID: this.settings.settings.currentID,
      selectedComparison: this.data.differentialForm.comparisonSelect,
      isAutoSave: false,
      version: CURRENT_STATE_VERSION,
      settings,
      data
    };
  }

  loadStateFromObject(state: any): void {
    let loadedState = state;
    if (this.migration.isOldFormat(state)) {
      loadedState = this.migration.upgradeImportedState(state);
    }

    this.data.clear();
    this.data.selectedMap = loadedState.data.selectedMap;
    this.data.selected = loadedState.data.selected;
    this.data.selectOperationNames = loadedState.data.selectOperationNames;

    for (const s in loadedState.settings) {
      if (s in this.settings.settings && s !== "currentID") {
        (this.settings.settings as any)[s] = loadedState.settings[s];
      }
    }

    this.data.loadDataTrigger.next(true);
  }

  downloadState(stateNumber: number): void {
    const state = this.exportState(stateNumber, { pretty: true });
    if (state) {
      const savedState = this.getSaveState(stateNumber);
      const fileName = savedState?.name
        ? `${savedState.name.replace(/[^a-z0-9]/gi, '_')}.json`
        : `SaveState${stateNumber}.json`;

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(state);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", fileName);
      dlAnchorElem.click();
    }
  }

  downloadStateWithOptions(stateNumber: number, options: ExportOptions): void {
    const state = this.exportState(stateNumber, options);
    if (state) {
      const savedState = this.getSaveState(stateNumber);
      const fileName = savedState?.name
        ? `${savedState.name.replace(/[^a-z0-9]/gi, '_')}.json`
        : `SaveState${stateNumber}.json`;

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(state);
      const dlAnchorElem = document.createElement('a');
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", fileName);
      dlAnchorElem.click();
    }
  }
}

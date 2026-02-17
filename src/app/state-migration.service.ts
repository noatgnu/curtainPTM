import { Injectable } from '@angular/core';
import { SavedState, CURRENT_STATE_VERSION } from './interfaces/saved-state.interface';

@Injectable({
  providedIn: 'root'
})
export class StateMigrationService {

  constructor() { }

  migrateOldStates(): void {
    const stateNumber = localStorage.getItem('SaveStateNumber');
    if (!stateNumber) {
      return;
    }

    for (let i = 0; i < parseInt(stateNumber, 10); i++) {
      const stateKey = 'SaveState' + i;
      const stateStr = localStorage.getItem(stateKey);
      if (stateStr) {
        const state = JSON.parse(stateStr);
        if (this.isOldFormat(state)) {
          const upgraded = this.upgradeState(state, CURRENT_STATE_VERSION);
          localStorage.setItem(stateKey, JSON.stringify(upgraded));
        }
      }
    }
  }

  getStateVersion(state: any): number {
    if (state.version === undefined || state.version === null) {
      return 1;
    }
    if (typeof state.version === 'number' && state.name !== undefined) {
      return state.version;
    }
    return 1;
  }

  isOldFormat(state: any): boolean {
    return this.getStateVersion(state) < CURRENT_STATE_VERSION;
  }

  upgradeState(state: any, targetVersion: number): SavedState {
    let currentVersion = this.getStateVersion(state);
    let upgradedState = { ...state };

    while (currentVersion < targetVersion) {
      switch (currentVersion) {
        case 1:
          upgradedState = this.upgradeV1ToV2(upgradedState);
          currentVersion = 2;
          break;
        default:
          currentVersion = targetVersion;
          break;
      }
    }

    return upgradedState as SavedState;
  }

  private upgradeV1ToV2(state: any): SavedState {
    const name = state.currentID && state.currentID !== ''
      ? `Session: ${state.currentID}`
      : `State #${state.id}`;

    return {
      id: state.id,
      name: name,
      description: 'Migrated from previous version',
      tags: [],
      date: state.date,
      currentID: state.currentID || '',
      selectedComparison: state.selectedComparison,
      isAutoSave: false,
      version: 2,
      settings: state.settings,
      data: state.data
    };
  }

  upgradeImportedState(state: any): SavedState {
    if (this.isOldFormat(state)) {
      return this.upgradeState(state, CURRENT_STATE_VERSION);
    }
    return state as SavedState;
  }
}

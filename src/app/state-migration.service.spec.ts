import { TestBed } from '@angular/core/testing';

import { StateMigrationService } from './state-migration.service';
import { CURRENT_STATE_VERSION } from './interfaces/saved-state.interface';

describe('StateMigrationService', () => {
  let service: StateMigrationService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [StateMigrationService]
    });

    service = TestBed.inject(StateMigrationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should identify old format state without version', () => {
    const oldState = {
      id: '1',
      date: Date.now(),
      currentID: 'session123',
      settings: {},
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    expect(service.isOldFormat(oldState)).toBeTrue();
    expect(service.getStateVersion(oldState)).toBe(1);
  });

  it('should identify new format state with version', () => {
    const newState = {
      id: '1',
      name: 'Test State',
      description: 'Test',
      tags: [],
      date: Date.now(),
      currentID: 'session123',
      isAutoSave: false,
      version: CURRENT_STATE_VERSION,
      settings: {},
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    expect(service.isOldFormat(newState)).toBeFalse();
    expect(service.getStateVersion(newState)).toBe(CURRENT_STATE_VERSION);
  });

  it('should upgrade v1 state to v2', () => {
    const oldState = {
      id: '5',
      date: Date.now(),
      currentID: 'session123',
      settings: { pCutoff: 0.05 },
      data: { selectedMap: { 'P12345': {} }, selected: ['P12345'], selectOperationNames: ['Selection 1'] }
    };

    const upgraded = service.upgradeState(oldState, 2);

    expect(upgraded.version).toBe(2);
    expect(upgraded.name).toBe('Session: session123');
    expect(upgraded.description).toBe('Migrated from previous version');
    expect(upgraded.tags).toEqual([]);
    expect(upgraded.isAutoSave).toBeFalse();
    expect(upgraded.settings).toEqual({ pCutoff: 0.05 });
    expect(upgraded.data.selectedMap).toEqual({ 'P12345': {} });
  });

  it('should generate name from state ID if no currentID', () => {
    const oldState = {
      id: '7',
      date: Date.now(),
      currentID: '',
      settings: {},
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    const upgraded = service.upgradeState(oldState, 2);
    expect(upgraded.name).toBe('State #7');
  });

  it('should migrate old states in localStorage', () => {
    const oldState = {
      id: '0',
      date: Date.now(),
      currentID: 'test',
      settings: {},
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    localStorage.setItem('SaveStateNumber', '1');
    localStorage.setItem('SaveState0', JSON.stringify(oldState));

    service.migrateOldStates();

    const migratedStr = localStorage.getItem('SaveState0');
    expect(migratedStr).toBeTruthy();

    const migrated = JSON.parse(migratedStr!);
    expect(migrated.version).toBe(CURRENT_STATE_VERSION);
    expect(migrated.name).toBe('Session: test');
  });

  it('should not re-migrate already migrated states', () => {
    const newState = {
      id: '0',
      name: 'Already Migrated',
      description: 'Test',
      tags: ['custom'],
      date: Date.now(),
      currentID: 'test',
      isAutoSave: false,
      version: CURRENT_STATE_VERSION,
      settings: {},
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    localStorage.setItem('SaveStateNumber', '1');
    localStorage.setItem('SaveState0', JSON.stringify(newState));

    service.migrateOldStates();

    const storedStr = localStorage.getItem('SaveState0');
    const stored = JSON.parse(storedStr!);
    expect(stored.name).toBe('Already Migrated');
    expect(stored.tags).toEqual(['custom']);
  });

  it('should upgrade imported state', () => {
    const oldState = {
      id: '1',
      date: Date.now(),
      currentID: 'imported',
      settings: {},
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    const upgraded = service.upgradeImportedState(oldState);
    expect(upgraded.version).toBe(CURRENT_STATE_VERSION);
    expect(upgraded.name).toBe('Session: imported');
  });

  it('should return new format state unchanged from upgradeImportedState', () => {
    const newState = {
      id: '1',
      name: 'Custom Name',
      description: 'Custom',
      tags: ['tag1'],
      date: Date.now(),
      currentID: 'test',
      isAutoSave: false,
      version: CURRENT_STATE_VERSION,
      settings: {},
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    const result = service.upgradeImportedState(newState);
    expect(result.name).toBe('Custom Name');
    expect(result.tags).toEqual(['tag1']);
  });
});

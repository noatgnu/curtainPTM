import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { SaveStateService } from './save-state.service';
import { SettingsService } from './settings.service';
import { DataService } from './data.service';
import { AutoSaveService } from './auto-save.service';
import { StateMigrationService } from './state-migration.service';
import { CURRENT_STATE_VERSION } from './interfaces/saved-state.interface';

describe('SaveStateService', () => {
  let service: SaveStateService;

  const mockSettings = {
    currentID: 'test-session',
    pCutoff: 0.05,
    log2FCCutoff: 1
  };

  const mockSettingsService = {
    settings: mockSettings
  };

  const mockDataService = {
    selectedMap: { 'P12345': { selected: true } },
    selected: ['P12345'],
    selectOperationNames: ['Selection 1'],
    differentialForm: { comparisonSelect: null },
    clear: jasmine.createSpy('clear'),
    loadDataTrigger: new Subject<boolean>()
  };

  const mockAutoSaveService = {
    autoSaveTrigger: new Subject<void>(),
    getMaxAutoSaves: jasmine.createSpy('getMaxAutoSaves').and.returnValue(5)
  };

  const mockStateMigrationService = {
    migrateOldStates: jasmine.createSpy('migrateOldStates'),
    isOldFormat: jasmine.createSpy('isOldFormat').and.returnValue(false),
    upgradeState: jasmine.createSpy('upgradeState').and.callFake((state: any) => state),
    upgradeImportedState: jasmine.createSpy('upgradeImportedState').and.callFake((state: any) => state)
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        SaveStateService,
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: DataService, useValue: mockDataService },
        { provide: AutoSaveService, useValue: mockAutoSaveService },
        { provide: StateMigrationService, useValue: mockStateMigrationService }
      ]
    });

    service = TestBed.inject(SaveStateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should migrate old states on init', () => {
    expect(mockStateMigrationService.migrateOldStates).toHaveBeenCalled();
  });

  it('should save state with metadata', () => {
    const stateId = service.saveStateWithMetadata('Test State', 'Test description', ['tag1', 'tag2']);

    expect(stateId).toBe('0');

    const savedState = service.getSaveState(0);
    expect(savedState).toBeTruthy();
    expect(savedState!.name).toBe('Test State');
    expect(savedState!.description).toBe('Test description');
    expect(savedState!.tags).toEqual(['tag1', 'tag2']);
    expect(savedState!.version).toBe(CURRENT_STATE_VERSION);
  });

  it('should save state with default name if not provided', () => {
    const stateId = service.saveStateWithMetadata('', '', []);
    const savedState = service.getSaveState(parseInt(stateId));

    expect(savedState!.name).toBe(`State #${stateId}`);
  });

  it('should load state', () => {
    service.saveStateWithMetadata('Test', '', []);
    service.loadState(0);

    expect(mockDataService.clear).toHaveBeenCalled();
  });

  it('should get all tags from states', () => {
    service.saveStateWithMetadata('State 1', '', ['tag1', 'tag2']);
    service.saveStateWithMetadata('State 2', '', ['tag2', 'tag3']);

    const tags = service.getAllTags();
    expect(tags).toContain('tag1');
    expect(tags).toContain('tag2');
    expect(tags).toContain('tag3');
  });

  it('should get states by tag', () => {
    service.saveStateWithMetadata('State 1', '', ['tag1']);
    service.saveStateWithMetadata('State 2', '', ['tag1', 'tag2']);
    service.saveStateWithMetadata('State 3', '', ['tag2']);

    const statesWithTag1 = service.getStatesByTag('tag1');
    expect(statesWithTag1.length).toBe(2);
  });

  it('should update state tags', () => {
    service.saveStateWithMetadata('Test', '', ['oldTag']);
    service.updateStateTags('0', ['newTag1', 'newTag2']);

    const savedState = service.getSaveState(0);
    expect(savedState!.tags).toEqual(['newTag1', 'newTag2']);
  });

  it('should update state metadata', () => {
    service.saveStateWithMetadata('Old Name', 'Old Desc', ['oldTag']);
    service.updateStateMetadata('0', 'New Name', 'New Desc', ['newTag']);

    const savedState = service.getSaveState(0);
    expect(savedState!.name).toBe('New Name');
    expect(savedState!.description).toBe('New Desc');
    expect(savedState!.tags).toEqual(['newTag']);
  });

  it('should remove state', () => {
    service.saveStateWithMetadata('Test', '', []);
    expect(service.getSaveState(0)).toBeTruthy();

    service.removeState(0);
    expect(service.getSaveState(0)).toBeNull();
  });

  it('should get state preview', () => {
    service.saveStateWithMetadata('Test State', 'Test desc', ['tag1']);
    const preview = service.getStatePreview(0);

    expect(preview).toBeTruthy();
    expect(preview!.metadata.name).toBe('Test State');
    expect(preview!.metadata.description).toBe('Test desc');
    expect(preview!.metadata.tags).toEqual(['tag1']);
  });

  it('should export state with pretty format', () => {
    service.saveStateWithMetadata('Test', '', []);
    const exported = service.exportState(0, { pretty: true });

    expect(exported).toContain('\n');
    expect(exported).toContain('  ');
  });

  it('should export state with minified format', () => {
    service.saveStateWithMetadata('Test', '', []);
    const exported = service.exportState(0, { pretty: false });

    expect(exported).not.toContain('\n  ');
  });

  it('should create selective state with specific categories', () => {
    const selectiveState = service.createSelectiveState(['cutoffs']);

    expect(selectiveState).toBeTruthy();
    expect(selectiveState.version).toBe(CURRENT_STATE_VERSION);
  });

  it('should auto-save state', () => {
    service.autoSaveState();
    const autoSaves = service.getAutoSaves();

    expect(autoSaves.length).toBe(1);
    expect(autoSaves[0].isAutoSave).toBeTrue();
    expect(autoSaves[0].name).toBe('Auto-save');
  });

  it('should delete auto-save', () => {
    service.autoSaveState();
    const autoSaves = service.getAutoSaves();
    const autoSaveKey = autoSaves[0].id.toString();

    service.deleteAutoSave(autoSaveKey);
    expect(service.getAutoSaves().length).toBe(0);
  });

  it('should load state from object', () => {
    const stateObject = {
      id: '1',
      name: 'Imported State',
      description: '',
      tags: [],
      date: Date.now(),
      currentID: 'imported',
      isAutoSave: false,
      version: CURRENT_STATE_VERSION,
      settings: { pCutoff: 0.01 },
      data: { selectedMap: {}, selected: [], selectOperationNames: [] }
    };

    service.loadStateFromObject(stateObject);
    expect(mockDataService.clear).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { SelectiveImportDialogComponent } from './selective-import-dialog.component';
import { SaveStateService } from '../../save-state.service';
import { StateMigrationService } from '../../state-migration.service';

describe('SelectiveImportDialogComponent', () => {
  let component: SelectiveImportDialogComponent;
  let fixture: ComponentFixture<SelectiveImportDialogComponent>;

  const mockSaveStateService = {
    loadStateFromObject: jasmine.createSpy('loadStateFromObject'),
    loadSelectiveState: jasmine.createSpy('loadSelectiveState')
  };

  const mockStateMigrationService = {
    isOldFormat: jasmine.createSpy('isOldFormat').and.returnValue(false),
    upgradeState: jasmine.createSpy('upgradeState').and.callFake((state: any) => state)
  };

  const mockNgbActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  const validStateJson = JSON.stringify({
    id: '1',
    name: 'Test State',
    description: 'Test description',
    tags: ['test'],
    date: Date.now(),
    currentID: 'session123',
    isAutoSave: false,
    version: 2,
    settings: { pCutoff: 0.05 },
    data: { selectedMap: {}, selected: [], selectOperationNames: [] }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [SelectiveImportDialogComponent],
      providers: [
        { provide: SaveStateService, useValue: mockSaveStateService },
        { provide: StateMigrationService, useValue: mockStateMigrationService },
        { provide: NgbActiveModal, useValue: mockNgbActiveModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectiveImportDialogComponent);
    component = fixture.componentInstance;
    component.fileContent = validStateJson;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should parse valid JSON file on init', () => {
    component.ngOnInit();
    expect(component.parsedState).toBeTruthy();
    expect(component.parseError).toBe('');
  });

  it('should set parse error for invalid JSON', () => {
    component.fileContent = 'invalid json';
    component.parseFile();
    expect(component.parseError).toBe('Invalid JSON file format');
    expect(component.parsedState).toBeNull();
  });

  it('should import all when importAll is called', () => {
    component.ngOnInit();
    component.importAll();
    expect(mockSaveStateService.loadStateFromObject).toHaveBeenCalled();
    expect(mockNgbActiveModal.close).toHaveBeenCalled();
  });

  it('should import selected categories', () => {
    component.ngOnInit();
    component.selectedCategories = { colors: true, cutoffs: false };
    component.importSelected();
    expect(mockSaveStateService.loadSelectiveState).toHaveBeenCalled();
  });

  it('should dismiss modal on cancel', () => {
    component.cancel();
    expect(mockNgbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should format date correctly', () => {
    const timestamp = new Date('2026-01-15T10:30:00').getTime();
    const formatted = component.formatDate(timestamp);
    expect(formatted).toContain('2026');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { LocalSessionStateModalComponent } from './local-session-state-modal.component';
import { SaveStateService } from '../../save-state.service';
import { AutoSaveService } from '../../auto-save.service';

describe('LocalSessionStateModalComponent', () => {
  let component: LocalSessionStateModalComponent;
  let fixture: ComponentFixture<LocalSessionStateModalComponent>;

  const mockSaveStateService = {
    states: [],
    getSaveState: jasmine.createSpy('getSaveState').and.returnValue(null),
    getAllTags: jasmine.createSpy('getAllTags').and.returnValue([]),
    getAutoSaves: jasmine.createSpy('getAutoSaves').and.returnValue([]),
    loadState: jasmine.createSpy('loadState'),
    downloadState: jasmine.createSpy('downloadState'),
    downloadStateWithOptions: jasmine.createSpy('downloadStateWithOptions'),
    removeState: jasmine.createSpy('removeState'),
    loadAutoSave: jasmine.createSpy('loadAutoSave'),
    deleteAutoSave: jasmine.createSpy('deleteAutoSave')
  };

  const mockAutoSaveService = {
    isEnabled: jasmine.createSpy('isEnabled').and.returnValue(false),
    getIntervalMinutes: jasmine.createSpy('getIntervalMinutes').and.returnValue(5),
    startAutoSave: jasmine.createSpy('startAutoSave'),
    stopAutoSave: jasmine.createSpy('stopAutoSave'),
    setInterval: jasmine.createSpy('setInterval')
  };

  const mockNgbActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  const mockNgbModal = {
    open: jasmine.createSpy('open').and.returnValue({
      result: Promise.resolve(),
      componentInstance: {}
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LocalSessionStateModalComponent],
      providers: [
        { provide: SaveStateService, useValue: mockSaveStateService },
        { provide: AutoSaveService, useValue: mockAutoSaveService },
        { provide: NgbActiveModal, useValue: mockNgbActiveModal },
        { provide: NgbModal, useValue: mockNgbModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LocalSessionStateModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with auto-save settings', () => {
    component.ngOnInit();
    expect(mockAutoSaveService.isEnabled).toHaveBeenCalled();
    expect(mockAutoSaveService.getIntervalMinutes).toHaveBeenCalled();
    expect(mockSaveStateService.getAllTags).toHaveBeenCalled();
    expect(mockSaveStateService.getAutoSaves).toHaveBeenCalled();
  });

  it('should dismiss modal on close', () => {
    component.close();
    expect(mockNgbActiveModal.dismiss).toHaveBeenCalled();
  });

  it('should toggle auto-save', () => {
    component.autoSaveEnabled = false;
    component.toggleAutoSave();
    expect(mockAutoSaveService.startAutoSave).toHaveBeenCalled();
  });

  it('should format relative time correctly', () => {
    const now = Date.now();
    expect(component.getRelativeTime(now)).toBe('Just now');
    expect(component.getRelativeTime(now - 60000)).toBe('1 min ago');
    expect(component.getRelativeTime(now - 3600000)).toBe('1 hour ago');
    expect(component.getRelativeTime(now - 86400000)).toBe('1 day ago');
  });
});

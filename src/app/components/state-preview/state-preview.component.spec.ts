import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatePreviewComponent } from './state-preview.component';
import { SaveStateService } from '../../save-state.service';

describe('StatePreviewComponent', () => {
  let component: StatePreviewComponent;
  let fixture: ComponentFixture<StatePreviewComponent>;

  const mockStatePreview = {
    metadata: {
      id: '1',
      name: 'Test State',
      description: 'Test description',
      tags: ['tag1'],
      date: Date.now(),
      currentID: 'session123',
      isAutoSave: false,
      version: 2
    },
    categorySummary: [
      { category: { key: 'colors', label: 'Color Settings', description: 'Colors', settingsKeys: [], isDataCategory: false }, itemCount: 5, hasData: true },
      { category: { key: 'cutoffs', label: 'Cutoffs', description: 'Analysis cutoffs', settingsKeys: [], isDataCategory: false }, itemCount: 0, hasData: false }
    ],
    totalSettingsCount: 10,
    selectionsCount: 5
  };

  const mockSaveStateService = {
    getStatePreview: jasmine.createSpy('getStatePreview').and.returnValue(mockStatePreview)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatePreviewComponent],
      providers: [
        { provide: SaveStateService, useValue: mockSaveStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatePreviewComponent);
    component = fixture.componentInstance;
    component.stateNumber = 1;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load preview on init when stateNumber is valid', () => {
    component.ngOnInit();
    expect(mockSaveStateService.getStatePreview).toHaveBeenCalledWith(1);
    expect(component.preview).toBeTruthy();
  });

  it('should not load preview when stateNumber is -1', () => {
    mockSaveStateService.getStatePreview.calls.reset();
    component.stateNumber = -1;
    component.ngOnInit();
    expect(mockSaveStateService.getStatePreview).not.toHaveBeenCalled();
  });

  it('should filter categories with data', () => {
    component.ngOnInit();
    const categoriesWithData = component.getCategoriesWithData();
    expect(categoriesWithData.length).toBe(1);
    expect(categoriesWithData[0].category.key).toBe('colors');
  });

  it('should format date correctly', () => {
    const timestamp = new Date('2026-01-15T10:30:00').getTime();
    const formatted = component.formatDate(timestamp);
    expect(formatted).toContain('2026');
  });
});

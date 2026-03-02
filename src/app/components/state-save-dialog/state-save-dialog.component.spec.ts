import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { StateSaveDialogComponent } from './state-save-dialog.component';
import { SaveStateService } from '../../save-state.service';

describe('StateSaveDialogComponent', () => {
  let component: StateSaveDialogComponent;
  let fixture: ComponentFixture<StateSaveDialogComponent>;

  const mockSaveStateService = {
    getAllTags: jasmine.createSpy('getAllTags').and.returnValue(['tag1', 'tag2']),
    saveStateWithMetadata: jasmine.createSpy('saveStateWithMetadata').and.returnValue('1'),
    createSelectiveState: jasmine.createSpy('createSelectiveState').and.returnValue({
      id: '1',
      name: '',
      description: '',
      tags: [],
      settings: {},
      data: {}
    }),
    states: [],
    getAvailableStates: jasmine.createSpy('getAvailableStates').and.returnValue([])
  };

  const mockNgbActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [StateSaveDialogComponent],
      providers: [
        { provide: SaveStateService, useValue: mockSaveStateService },
        { provide: NgbActiveModal, useValue: mockNgbActiveModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StateSaveDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load existing tags on init', () => {
    component.ngOnInit();
    expect(mockSaveStateService.getAllTags).toHaveBeenCalled();
    expect(component.existingTags).toEqual(['tag1', 'tag2']);
  });

  it('should add tag', () => {
    component.newTag = 'newTag';
    component.addTag();
    expect(component.tags).toContain('newTag');
    expect(component.newTag).toBe('');
  });

  it('should not add duplicate tag', () => {
    component.tags = ['existingTag'];
    component.newTag = 'existingTag';
    component.addTag();
    expect(component.tags.length).toBe(1);
  });

  it('should remove tag', () => {
    component.tags = ['tag1', 'tag2'];
    component.removeTag('tag1');
    expect(component.tags).toEqual(['tag2']);
  });

  it('should select existing tag', () => {
    component.tags = [];
    component.selectExistingTag('existingTag');
    expect(component.tags).toContain('existingTag');
  });

  it('should dismiss modal on cancel', () => {
    component.cancel();
    expect(mockNgbActiveModal.dismiss).toHaveBeenCalled();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectiveImportDialogComponent } from './selective-import-dialog.component';

describe('SelectiveImportDialogComponent', () => {
  let component: SelectiveImportDialogComponent;
  let fixture: ComponentFixture<SelectiveImportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectiveImportDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectiveImportDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

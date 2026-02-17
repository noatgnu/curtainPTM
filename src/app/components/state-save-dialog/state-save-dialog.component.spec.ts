import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StateSaveDialogComponent } from './state-save-dialog.component';

describe('StateSaveDialogComponent', () => {
  let component: StateSaveDialogComponent;
  let fixture: ComponentFixture<StateSaveDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StateSaveDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StateSaveDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

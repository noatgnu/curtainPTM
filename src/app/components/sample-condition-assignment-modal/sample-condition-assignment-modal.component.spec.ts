import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleConditionAssignmentModalComponent } from './sample-condition-assignment-modal.component';

describe('SampleConditionAssigmentModalComponent', () => {
  let component: SampleConditionAssignmentModalComponent;
  let fixture: ComponentFixture<SampleConditionAssignmentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleConditionAssignmentModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleConditionAssignmentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleAnnotationComponent } from './sample-annotation.component';

describe('SampleAnnotationComponent', () => {
  let component: SampleAnnotationComponent;
  let fixture: ComponentFixture<SampleAnnotationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleAnnotationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

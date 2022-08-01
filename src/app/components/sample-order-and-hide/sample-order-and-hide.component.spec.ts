import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleOrderAndHideComponent } from './sample-order-and-hide.component';

describe('SampleOrderAndHideComponent', () => {
  let component: SampleOrderAndHideComponent;
  let fixture: ComponentFixture<SampleOrderAndHideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleOrderAndHideComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleOrderAndHideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

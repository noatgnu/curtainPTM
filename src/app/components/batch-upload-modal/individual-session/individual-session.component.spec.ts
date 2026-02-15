import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndividualSessionComponent } from './individual-session.component';

describe('IndividualSessionComponent', () => {
  let component: IndividualSessionComponent;
  let fixture: ComponentFixture<IndividualSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IndividualSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndividualSessionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

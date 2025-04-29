import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataciteCitationComponent } from './datacite-citation.component';

describe('DataciteCitationComponent', () => {
  let component: DataciteCitationComponent;
  let fixture: ComponentFixture<DataciteCitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataciteCitationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataciteCitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

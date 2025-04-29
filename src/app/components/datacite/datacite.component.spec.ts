import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataciteComponent } from './datacite.component';

describe('DataciteComponent', () => {
  let component: DataciteComponent;
  let fixture: ComponentFixture<DataciteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataciteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataciteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

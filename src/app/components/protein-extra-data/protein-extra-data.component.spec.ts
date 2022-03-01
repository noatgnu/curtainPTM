import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinExtraDataComponent } from './protein-extra-data.component';

describe('ProteinExtraDataComponent', () => {
  let component: ProteinExtraDataComponent;
  let fixture: ComponentFixture<ProteinExtraDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinExtraDataComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinExtraDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

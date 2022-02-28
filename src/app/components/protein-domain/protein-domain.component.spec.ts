import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProteinDomainComponent } from './protein-domain.component';

describe('ProteinDomainComponent', () => {
  let component: ProteinDomainComponent;
  let fixture: ComponentFixture<ProteinDomainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProteinDomainComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProteinDomainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

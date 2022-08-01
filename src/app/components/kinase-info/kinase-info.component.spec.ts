import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KinaseInfoComponent } from './kinase-info.component';

describe('KinaseInfoComponent', () => {
  let component: KinaseInfoComponent;
  let fixture: ComponentFixture<KinaseInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KinaseInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KinaseInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

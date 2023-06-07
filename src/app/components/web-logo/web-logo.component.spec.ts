import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebLogoComponent } from './web-logo.component';

describe('WebLogoComponent', () => {
  let component: WebLogoComponent;
  let fixture: ComponentFixture<WebLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WebLogoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebLogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastProgressbarComponent } from './toast-progressbar.component';

describe('ToastProgressbarComponent', () => {
  let component: ToastProgressbarComponent;
  let fixture: ComponentFixture<ToastProgressbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastProgressbarComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToastProgressbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

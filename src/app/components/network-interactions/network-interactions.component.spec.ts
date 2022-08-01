import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkInteractionsComponent } from './network-interactions.component';

describe('NetworkInteractionsComponent', () => {
  let component: NetworkInteractionsComponent;
  let fixture: ComponentFixture<NetworkInteractionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkInteractionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkInteractionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

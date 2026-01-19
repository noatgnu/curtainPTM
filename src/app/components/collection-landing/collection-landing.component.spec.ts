import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { CollectionLandingComponent } from './collection-landing.component';
import { AccountsService } from '../../accounts/accounts.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

describe('CollectionLandingComponent', () => {
  let component: CollectionLandingComponent;
  let fixture: ComponentFixture<CollectionLandingComponent>;

  const mockAccountsService = {
    curtainAPI: {
      user: { loginStatus: false },
      getCurtainCollection: jasmine.createSpy('getCurtainCollection').and.returnValue(
        Promise.resolve({
          data: {
            id: 1,
            name: 'Test Collection',
            description: 'Test Description',
            enable: true,
            owner: 1,
            owner_username: 'testuser',
            curtains: [1, 2],
            curtain_count: 2,
            accessible_curtains: [
              { id: 1, link_id: 'abc123', description: 'Session 1', created: '2024-01-01', curtain_type: 'PTM' }
            ],
            created: '2024-01-01',
            updated: '2024-01-01'
          }
        })
      )
    }
  };

  const mockActivatedRoute = {
    params: of({ id: '1' })
  };

  const mockNgbModal = {
    open: jasmine.createSpy('open')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionLandingComponent],
      providers: [
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: NgbModal, useValue: mockNgbModal }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionLandingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load collection on init', async () => {
    await fixture.whenStable();
    expect(mockAccountsService.curtainAPI.getCurtainCollection).toHaveBeenCalledWith(1, 'PTM');
  });

  it('should display collection name', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.collection()?.name).toBe('Test Collection');
  });

  it('should format date correctly', () => {
    const result = component.formatDate('2024-01-15T12:00:00Z');
    expect(result).toBeTruthy();
  });

  it('should set error on 404', async () => {
    mockAccountsService.curtainAPI.getCurtainCollection.and.returnValue(
      Promise.reject({ response: { status: 404 } })
    );
    await component.loadCollection(999);
    expect(component.error()).toBe('Collection not found or not publicly accessible.');
  });
});

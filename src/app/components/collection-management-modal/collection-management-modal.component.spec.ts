import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionManagementModalComponent } from './collection-management-modal.component';
import { AccountsService } from '../../accounts/accounts.service';
import { ToastService } from '../../toast.service';

describe('CollectionManagementModalComponent', () => {
  let component: CollectionManagementModalComponent;
  let fixture: ComponentFixture<CollectionManagementModalComponent>;

  const mockAccountsService = {
    curtainAPI: {
      user: { username: 'testuser' }
    },
    getCollections: jasmine.createSpy('getCollections').and.returnValue(Promise.resolve({ results: [] })),
    updateCollectionEnable: jasmine.createSpy('updateCollectionEnable').and.returnValue(Promise.resolve({}))
  };

  const mockToastService = {
    show: jasmine.createSpy('show').and.returnValue(Promise.resolve())
  };

  const mockActiveModal = {
    dismiss: jasmine.createSpy('dismiss'),
    close: jasmine.createSpy('close')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionManagementModalComponent],
      providers: [
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: ToastService, useValue: mockToastService },
        { provide: NgbActiveModal, useValue: mockActiveModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollectionManagementModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

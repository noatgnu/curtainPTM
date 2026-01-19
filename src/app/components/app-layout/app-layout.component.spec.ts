import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { AppLayoutComponent } from './app-layout.component';
import { ThemeService } from '../../theme.service';
import { AccountsService } from '../../accounts/accounts.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

describe('AppLayoutComponent', () => {
  let component: AppLayoutComponent;
  let fixture: ComponentFixture<AppLayoutComponent>;

  const mockThemeService = {
    getCurrentTheme: () => 'light',
    getCurrentThemeName: () => 'default',
    getAvailableThemes: () => [{ name: 'default', displayName: 'Default' }],
    setName: jasmine.createSpy('setName'),
    setMode: jasmine.createSpy('setMode')
  };

  const mockAccountsService = {
    curtainAPI: {
      user: { loginStatus: false }
    },
    logout: jasmine.createSpy('logout')
  };

  const mockNgbModal = {
    open: jasmine.createSpy('open')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent, RouterModule.forRoot([])],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: AccountsService, useValue: mockAccountsService },
        { provide: NgbModal, useValue: mockNgbModal }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

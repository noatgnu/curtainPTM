import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import { AccountsService } from './accounts/accounts.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockAccountsService: jasmine.SpyObj<AccountsService>;

  beforeEach(() => {
    const mockCurtainAPI = {
      getSiteProperties: jasmine.createSpy('getSiteProperties').and.returnValue(
        Promise.resolve({ data: {} })
      )
    };

    mockAccountsService = {
      curtainAPI: mockCurtainAPI
    } as any;

    TestBed.configureTestingModule({
      providers: [
        AnalyticsService,
        { provide: AccountsService, useValue: mockAccountsService }
      ]
    });

    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not load Umami script when config is missing', async () => {
    mockAccountsService.curtainAPI.getSiteProperties = jasmine.createSpy().and.returnValue(
      Promise.resolve({ data: {} })
    );

    await service.initialize();

    const scripts = document.querySelectorAll('script[data-website-id]');
    expect(scripts.length).toBe(0);
  });

  it('should load Umami script when config is provided', async () => {
    mockAccountsService.curtainAPI.getSiteProperties = jasmine.createSpy().and.returnValue(
      Promise.resolve({
        data: {
          umami_website_id: 'test-website-id',
          umami_url: 'https://analytics.example.com/script.js'
        }
      })
    );

    await service.initialize();

    const script = document.querySelector('script[data-website-id="test-website-id"]');
    expect(script).toBeTruthy();
    expect(script?.getAttribute('src')).toBe('https://analytics.example.com/script.js');
    expect(script?.getAttribute('data-do-not-track')).toBe('true');
    expect(script?.getAttribute('data-cache')).toBe('true');
  });

  it('should not load Umami script twice', async () => {
    mockAccountsService.curtainAPI.getSiteProperties = jasmine.createSpy().and.returnValue(
      Promise.resolve({
        data: {
          umami_website_id: 'test-website-id',
          umami_url: 'https://analytics.example.com/script.js'
        }
      })
    );

    await service.initialize();
    await service.initialize();

    const scripts = document.querySelectorAll('script[data-website-id="test-website-id"]');
    expect(scripts.length).toBe(1);
  });

  it('should handle errors gracefully', async () => {
    mockAccountsService.curtainAPI.getSiteProperties = jasmine.createSpy().and.returnValue(
      Promise.reject(new Error('Network error'))
    );

    await expectAsync(service.initialize()).toBeResolved();
  });

  afterEach(() => {
    const scripts = document.querySelectorAll('script[data-website-id]');
    scripts.forEach(script => script.remove());
  });
});

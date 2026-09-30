import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';

import { AutoSaveService } from './auto-save.service';

describe('AutoSaveService', () => {
  let service: AutoSaveService;
  let ngZone: NgZone;

  beforeEach(() => {
    localStorage.clear();
    jasmine.clock().install();

    TestBed.configureTestingModule({
      providers: [AutoSaveService]
    });

    ngZone = TestBed.inject(NgZone);
    service = TestBed.inject(AutoSaveService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    localStorage.clear();
    jasmine.clock().uninstall();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default interval of 5 minutes', () => {
    expect(service.getIntervalMinutes()).toBe(5);
  });

  it('should have default max auto-saves of 5', () => {
    expect(service.getMaxAutoSaves()).toBe(5);
  });

  it('should be disabled by default', () => {
    expect(service.isEnabled()).toBeFalse();
  });

  it('should enable auto-save when startAutoSave is called', () => {
    service.startAutoSave();
    expect(service.isEnabled()).toBeTrue();
  });

  it('should disable auto-save when stopAutoSave is called', () => {
    service.startAutoSave();
    service.stopAutoSave();
    expect(service.isEnabled()).toBeFalse();
  });

  it('should update interval', () => {
    service.setInterval(10);
    expect(service.getIntervalMinutes()).toBe(10);
  });

  it('should update max auto-saves', () => {
    service.setMaxAutoSaves(10);
    expect(service.getMaxAutoSaves()).toBe(10);
  });

  it('should generate unique tab ID', () => {
    const tabId = service.getTabId();
    expect(tabId).toBeTruthy();
    expect(tabId.startsWith('tab_')).toBeTrue();
  });

  it('should persist settings to localStorage', () => {
    service.setInterval(10);
    service.setMaxAutoSaves(8);

    const stored = localStorage.getItem('AutoSaveSettings');
    expect(stored).toBeTruthy();

    const settings = JSON.parse(stored!);
    expect(settings.autoSaveInterval).toBe(10 * 60 * 1000);
    expect(settings.maxAutoSaves).toBe(8);
  });

  it('should emit autoSaveTrigger when interval fires', () => {
    const initialValue = service.autoSaveTrigger();

    service.startAutoSave();
    jasmine.clock().tick(5 * 60 * 1000);

    expect(service.autoSaveTrigger()).toBeGreaterThan(initialValue);
  });
});

import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutoSaveService implements OnDestroy {
  private autoSaveInterval: number = 5 * 60 * 1000;
  private maxAutoSaves: number = 5;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private enabled: boolean = false;
  private tabId: string;
  private storageListener: ((event: StorageEvent) => void) | null = null;

  autoSaveTrigger: Subject<void> = new Subject<void>();
  settingsChanged: Subject<void> = new Subject<void>();

  constructor(private ngZone: NgZone) {
    this.tabId = this.generateTabId();
    this.loadSettings();
    this.setupStorageListener();
    this.registerTab();
  }

  ngOnDestroy(): void {
    this.stopAutoSave();
    this.unregisterTab();
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
  }

  startAutoSave(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.enabled = true;
    this.saveSettings();
    this.intervalId = setInterval(() => {
      if (this.canPerformAutoSave()) {
        this.claimAutoSaveLock();
        this.autoSaveTrigger.next();
      }
    }, this.autoSaveInterval);
  }

  stopAutoSave(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.enabled = false;
    this.saveSettings();
  }

  setInterval(minutes: number): void {
    this.autoSaveInterval = minutes * 60 * 1000;
    this.saveSettings();
    if (this.enabled) {
      this.startAutoSave();
    }
  }

  setMaxAutoSaves(count: number): void {
    this.maxAutoSaves = count;
    this.saveSettings();
  }

  getIntervalMinutes(): number {
    return this.autoSaveInterval / 60 / 1000;
  }

  getMaxAutoSaves(): number {
    return this.maxAutoSaves;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getTabId(): string {
    return this.tabId;
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private registerTab(): void {
    const tabs = this.getActiveTabs();
    tabs[this.tabId] = { lastSeen: Date.now(), enabled: this.enabled };
    localStorage.setItem('AutoSaveTabs', JSON.stringify(tabs));
  }

  private unregisterTab(): void {
    const tabs = this.getActiveTabs();
    delete tabs[this.tabId];
    localStorage.setItem('AutoSaveTabs', JSON.stringify(tabs));
  }

  private getActiveTabs(): { [tabId: string]: { lastSeen: number; enabled: boolean } } {
    const stored = localStorage.getItem('AutoSaveTabs');
    if (!stored) return {};
    const tabs = JSON.parse(stored);
    const now = Date.now();
    const staleThreshold = 60 * 1000;
    for (const id of Object.keys(tabs)) {
      if (now - tabs[id].lastSeen > staleThreshold) {
        delete tabs[id];
      }
    }
    return tabs;
  }

  private canPerformAutoSave(): boolean {
    const lockData = localStorage.getItem('AutoSaveLock');
    if (lockData) {
      const lock = JSON.parse(lockData);
      const lockAge = Date.now() - lock.timestamp;
      if (lockAge < 10000 && lock.tabId !== this.tabId) {
        return false;
      }
    }
    return true;
  }

  private claimAutoSaveLock(): void {
    localStorage.setItem('AutoSaveLock', JSON.stringify({
      tabId: this.tabId,
      timestamp: Date.now()
    }));
  }

  private setupStorageListener(): void {
    this.storageListener = (event: StorageEvent) => {
      if (event.key === 'AutoSaveSettings' && event.newValue) {
        this.ngZone.run(() => {
          const settings = JSON.parse(event.newValue!);
          this.autoSaveInterval = settings.autoSaveInterval || 5 * 60 * 1000;
          this.maxAutoSaves = settings.maxAutoSaves || 5;
          this.settingsChanged.next();
        });
      }
    };
    window.addEventListener('storage', this.storageListener);

    setInterval(() => {
      this.registerTab();
    }, 30000);
  }

  private saveSettings(): void {
    const settings = {
      autoSaveInterval: this.autoSaveInterval,
      maxAutoSaves: this.maxAutoSaves
    };
    localStorage.setItem('AutoSaveSettings', JSON.stringify(settings));
    this.registerTab();
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('AutoSaveSettings');
    if (stored) {
      const settings = JSON.parse(stored);
      this.autoSaveInterval = settings.autoSaveInterval || 5 * 60 * 1000;
      this.maxAutoSaves = settings.maxAutoSaves || 5;
    }
  }
}

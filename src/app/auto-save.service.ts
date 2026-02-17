import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutoSaveService implements OnDestroy {
  private autoSaveInterval: number = 5 * 60 * 1000;
  private maxAutoSaves: number = 5;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private enabled: boolean = false;

  autoSaveTrigger: Subject<void> = new Subject<void>();

  constructor() {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.stopAutoSave();
  }

  startAutoSave(): void {
    if (this.intervalId) {
      this.stopAutoSave();
    }
    this.enabled = true;
    this.saveSettings();
    this.intervalId = setInterval(() => {
      this.autoSaveTrigger.next();
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

  private saveSettings(): void {
    const settings = {
      autoSaveInterval: this.autoSaveInterval,
      maxAutoSaves: this.maxAutoSaves,
      enabled: this.enabled
    };
    localStorage.setItem('AutoSaveSettings', JSON.stringify(settings));
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('AutoSaveSettings');
    if (stored) {
      const settings = JSON.parse(stored);
      this.autoSaveInterval = settings.autoSaveInterval || 5 * 60 * 1000;
      this.maxAutoSaves = settings.maxAutoSaves || 5;
      if (settings.enabled) {
        this.startAutoSave();
      }
    }
  }
}

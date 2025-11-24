import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY = 'curtain-theme';
  private currentTheme = new BehaviorSubject<Theme>('light');
  public theme$ = this.currentTheme.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedTheme = this.getSavedTheme();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.setTheme(initialTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getSavedTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  private getSavedTheme(): Theme | null {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved as Theme | null;
  }

  setTheme(theme: Theme): void {
    this.currentTheme.next(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme.value === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getCurrentTheme(): Theme {
    return this.currentTheme.value;
  }

  isDarkMode(): boolean {
    return this.currentTheme.value === 'dark';
  }
}

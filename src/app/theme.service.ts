import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
export type ThemeName = 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  mode: ThemeMode;
}

export interface Theme {
  name: ThemeName;
  displayName: string;
  light: {
    primary: string;
    secondary: string;
    success: string;
    info: string;
    warning: string;
    danger: string;
  };
  dark: {
    primary: string;
    secondary: string;
    success: string;
    info: string;
    warning: string;
    danger: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly STORAGE_KEY_MODE = 'curtain-theme-mode';
  private readonly STORAGE_KEY_NAME = 'curtain-theme-name';

  readonly mode = signal<ThemeMode>('light');
  readonly name = signal<ThemeName>('default');
  private readonly _beforeChangeCounter = signal(0);
  readonly beforeThemeChange = this._beforeChangeCounter.asReadonly();

  private themes: Theme[] = [
    {
      name: 'default',
      displayName: 'Default',
      light: {
        primary: '#2E2D62',
        secondary: '#a4a4a4',
        success: '#003632',
        info: '#8294C4',
        warning: '#FFD6A5',
        danger: '#FF9B9B'
      },
      dark: {
        primary: '#6366f1',
        secondary: '#94a3b8',
        success: '#10b981',
        info: '#3b82f6',
        warning: '#f59e0b',
        danger: '#ef4444'
      }
    },
    {
      name: 'ocean',
      displayName: 'Ocean',
      light: {
        primary: '#0077be',
        secondary: '#607d8b',
        success: '#00695c',
        info: '#0097a7',
        warning: '#ff9800',
        danger: '#d32f2f'
      },
      dark: {
        primary: '#29b6f6',
        secondary: '#90a4ae',
        success: '#26a69a',
        info: '#26c6da',
        warning: '#ffa726',
        danger: '#ef5350'
      }
    },
    {
      name: 'forest',
      displayName: 'Forest',
      light: {
        primary: '#2e7d32',
        secondary: '#757575',
        success: '#388e3c',
        info: '#00796b',
        warning: '#f57c00',
        danger: '#c62828'
      },
      dark: {
        primary: '#66bb6a',
        secondary: '#9e9e9e',
        success: '#81c784',
        info: '#4db6ac',
        warning: '#ff9800',
        danger: '#e57373'
      }
    },
    {
      name: 'sunset',
      displayName: 'Sunset',
      light: {
        primary: '#e64a19',
        secondary: '#8d6e63',
        success: '#689f38',
        info: '#0288d1',
        warning: '#fbc02d',
        danger: '#c62828'
      },
      dark: {
        primary: '#ff7043',
        secondary: '#a1887f',
        success: '#9ccc65',
        info: '#29b6f6',
        warning: '#ffeb3b',
        danger: '#ef5350'
      }
    },
    {
      name: 'lavender',
      displayName: 'Lavender',
      light: {
        primary: '#7b1fa2',
        secondary: '#9e9e9e',
        success: '#388e3c',
        info: '#1976d2',
        warning: '#f57c00',
        danger: '#d32f2f'
      },
      dark: {
        primary: '#ba68c8',
        secondary: '#bdbdbd',
        success: '#81c784',
        info: '#64b5f6',
        warning: '#ffb74d',
        danger: '#e57373'
      }
    }
  ];

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    const savedMode = this.getSavedMode();
    const savedName = this.getSavedName();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialMode = savedMode || (prefersDark ? 'dark' : 'light');
    const initialName = savedName || 'default';

    this.setTheme(initialName, initialMode, true);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!this.getSavedMode()) {
        this.setMode(e.matches ? 'dark' : 'light');
      }
    });
  }

  private getSavedMode(): ThemeMode | null {
    const saved = localStorage.getItem(this.STORAGE_KEY_MODE);
    return saved as ThemeMode | null;
  }

  private getSavedName(): ThemeName | null {
    const saved = localStorage.getItem(this.STORAGE_KEY_NAME);
    return saved as ThemeName | null;
  }

  setTheme(themeName: ThemeName, themeMode: ThemeMode, immediate: boolean = false): void {
    if (immediate) {
      this.applyThemeInternal(themeName, themeMode);
    } else {
      this._beforeChangeCounter.update(v => v + 1);
      setTimeout(() => {
        this.applyThemeInternal(themeName, themeMode);
      }, 500);
    }
  }

  private applyThemeInternal(themeName: ThemeName, themeMode: ThemeMode): void {
    this.name.set(themeName);
    this.mode.set(themeMode);
    localStorage.setItem(this.STORAGE_KEY_NAME, themeName);
    localStorage.setItem(this.STORAGE_KEY_MODE, themeMode);

    document.documentElement.setAttribute('data-bs-theme', themeMode);
    document.documentElement.setAttribute('data-theme-name', themeName);

    this.applyThemeColors(themeName, themeMode);
  }

  setMode(themeMode: ThemeMode): void {
    this.setTheme(this.name(), themeMode);
  }

  setName(themeName: ThemeName): void {
    this.setTheme(themeName, this.mode());
  }

  private applyThemeColors(themeName: ThemeName, themeMode: ThemeMode): void {
    const theme = this.themes.find(t => t.name === themeName);
    if (!theme) return;

    const colors = themeMode === 'dark' ? theme.dark : theme.light;
    const root = document.documentElement;

    root.style.setProperty('--bs-primary', colors.primary);
    root.style.setProperty('--bs-secondary', colors.secondary);
    root.style.setProperty('--bs-success', colors.success);
    root.style.setProperty('--bs-info', colors.info);
    root.style.setProperty('--bs-warning', colors.warning);
    root.style.setProperty('--bs-danger', colors.danger);

    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '0, 0, 0';
    };

    root.style.setProperty('--bs-primary-rgb', hexToRgb(colors.primary));
    root.style.setProperty('--bs-secondary-rgb', hexToRgb(colors.secondary));
    root.style.setProperty('--bs-success-rgb', hexToRgb(colors.success));
    root.style.setProperty('--bs-info-rgb', hexToRgb(colors.info));
    root.style.setProperty('--bs-warning-rgb', hexToRgb(colors.warning));
    root.style.setProperty('--bs-danger-rgb', hexToRgb(colors.danger));
  }

  toggleTheme(): void {
    const newMode = this.mode() === 'light' ? 'dark' : 'light';
    this.setMode(newMode);
  }

  getCurrentTheme(): ThemeMode {
    return this.mode();
  }

  getCurrentThemeName(): ThemeName {
    return this.name();
  }

  isDarkMode(): boolean {
    return this.mode() === 'dark';
  }

  getAvailableThemes(): Theme[] {
    return this.themes;
  }

  getThemeConfig(): ThemeConfig {
    return {
      name: this.name(),
      displayName: this.themes.find(t => t.name === this.name())?.displayName || 'Default',
      mode: this.mode()
    };
  }
}

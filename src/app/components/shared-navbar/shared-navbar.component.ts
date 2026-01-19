import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ThemeService } from '../../theme.service';
import { AccountsService } from '../../accounts/accounts.service';
import { LoginModalComponent } from '../../accounts/login-modal/login-modal.component';
import { AccountsComponent } from '../../accounts/accounts/accounts.component';

@Component({
  selector: 'app-shared-navbar',
  standalone: true,
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './shared-navbar.component.html',
  styleUrl: './shared-navbar.component.scss'
})
export class SharedNavbarComponent {
  constructor(
    public themeService: ThemeService,
    public accounts: AccountsService,
    private modal: NgbModal
  ) {}

  get availableThemes() {
    return this.themeService.getAvailableThemes();
  }

  get currentThemeName() {
    return this.themeService.getCurrentThemeName();
  }

  isDarkMode(): boolean {
    return this.themeService.getCurrentTheme() === 'dark';
  }

  selectTheme(themeName: string): void {
    this.themeService.setName(themeName as any);
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    this.themeService.setMode(mode);
  }

  openLoginModal(): void {
    this.modal.open(LoginModalComponent);
  }

  openAccountModal(): void {
    this.modal.open(AccountsComponent, { size: 'xl' });
  }

  logout(): void {
    this.accounts.logout();
  }
}

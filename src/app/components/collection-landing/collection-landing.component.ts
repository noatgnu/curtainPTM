import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AccountsService } from '../../accounts/accounts.service';
import { CurtainCollection, AccessibleCurtain } from 'curtain-web-api';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginModalComponent } from '../../accounts/login-modal/login-modal.component';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-collection-landing',
  imports: [CommonModule, NgbProgressbarModule],
  templateUrl: './collection-landing.component.html',
  styleUrl: './collection-landing.component.scss',
})
export class CollectionLandingComponent implements OnInit, OnDestroy {
  collection = signal<CurtainCollection | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  private currentCollectionId: number | null = null;
  private loginSubscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private modal: NgbModal,
    public accounts: AccountsService
  ) {}

  ngOnInit(): void {
    this.initializeAndLoad();
  }

  private async initializeAndLoad(): Promise<void> {
    await this.accounts.curtainAPI.user.loadFromDB();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.currentCollectionId = parseInt(id, 10);
        if (this.isMobile()) {
          this.promptForNativeApp(this.currentCollectionId);
        }
        this.loadCollection(this.currentCollectionId);
      }
    });
  }

  private isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  private isIOS(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  private isMacOS(): boolean {
    return /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  private isMobile(): boolean {
    return this.isAndroid() || this.isIOS();
  }

  private promptForNativeApp(collectionId: number): void {
    if (confirm('Would you like to open this collection in the native CurtainPTM app?')) {
      const nativeAppUrl = `curtainptm://collection?collectionId=${encodeURIComponent(collectionId)}&curtainType=PTM&apiURL=${encodeURIComponent(environment.apiURL)}&frontendURL=${encodeURIComponent(location.origin)}`;
      window.location.href = nativeAppUrl;
    }
  }

  openInNativeApp(): void {
    if (this.currentCollectionId) {
      const nativeAppUrl = `curtainptm://collection?collectionId=${encodeURIComponent(this.currentCollectionId)}&curtainType=PTM&apiURL=${encodeURIComponent(environment.apiURL)}&frontendURL=${encodeURIComponent(location.origin)}`;
      window.location.href = nativeAppUrl;
    }
  }

  get showNativeAppButton(): boolean {
    return this.isMacOS() && this.currentCollectionId !== null && !this.loading();
  }

  ngOnDestroy(): void {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  async loadCollection(id: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await this.accounts.curtainAPI.getCurtainCollection(id, 'PTM');
      this.collection.set(response.data);
    } catch (e: any) {
      if (e.response?.status === 404) {
        this.error.set('Collection not found or not publicly accessible.');
      } else {
        this.error.set('Failed to load collection.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  navigateToSession(curtain: AccessibleCurtain): void {
    window.open(`/#/${curtain.link_id}`, '_blank');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  openLogin(): void {
    const ref = this.modal.open(LoginModalComponent);
    this.loginSubscription = ref.componentInstance.loginStatus.asObservable().subscribe((loggedIn: boolean) => {
      if (loggedIn && this.currentCollectionId) {
        this.loadCollection(this.currentCollectionId);
      }
    });
  }

  exportSessionsToCSV(): void {
    const col = this.collection();
    if (!col || col.accessible_curtains.length === 0) {
      return;
    }

    const baseUrl = location.origin + '/#/';
    const headers = ['Name', 'Description', 'Link', 'Curtain Type', 'Created', 'Contact'];
    const rows = col.accessible_curtains.map(curtain => {
      const link = baseUrl + curtain.link_id;
      return [
        this.escapeCSV(curtain.description || 'Untitled Session'),
        this.escapeCSV(col.description || ''),
        this.escapeCSV(link),
        this.escapeCSV(curtain.curtain_type),
        this.escapeCSV(this.formatDate(curtain.created)),
        this.escapeCSV(col.owner_username)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${col.name.replace(/[^a-zA-Z0-9]/g, '_')}_sessions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

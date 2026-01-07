import { Injectable } from '@angular/core';
import { AccountsService } from './accounts/accounts.service';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private umamiLoaded = false;

  constructor(private accounts: AccountsService) {}

  async initialize(): Promise<void> {
    try {
      const response = await this.accounts.curtainAPI.getSiteProperties('curtainptm');

      if (response.data) {
        const { umami_website_id, umami_url } = response.data;

        if (umami_website_id && umami_url) {
          this.loadUmamiScript(umami_website_id, umami_url);
        }
      }
    } catch (error) {
      console.warn('Failed to load analytics configuration:', error);
    }
  }

  private loadUmamiScript(websiteId: string, scriptUrl: string): void {
    if (this.umamiLoaded) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = scriptUrl;
    script.setAttribute('data-website-id', websiteId);
    script.setAttribute('data-do-not-track', 'true');
    script.setAttribute('data-cache', 'true');
    script.setAttribute('data-domains', window.location.hostname);

    document.head.appendChild(script);
    this.umamiLoaded = true;
  }
}

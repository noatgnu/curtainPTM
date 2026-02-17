import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountsService } from '../../accounts/accounts.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../toast.service';

interface AccessibleCurtain {
  id: number;
  link_id: string;
  description: string;
  created: string;
  curtain_type: string;
}

interface Collection {
  id: number;
  name: string;
  description: string;
  curtain_count: number;
  curtains: number[];
  accessible_curtains: AccessibleCurtain[];
  updated: Date;
  owner_username: string;
  enable?: boolean;
}

@Component({
  selector: 'app-collection-management-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './collection-management-modal.component.html',
  styleUrl: './collection-management-modal.component.scss',
})
export class CollectionManagementModalComponent implements OnInit {
  @Input() linkId: string = '';

  collections: Collection[] = [];
  isLoading: boolean = false;
  searchQuery: string = '';
  filterMode: 'all' | 'containing' = 'all';

  constructor(
    public activeModal: NgbActiveModal,
    private accounts: AccountsService,
    private toast: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCollections();
  }

  async loadCollections(): Promise<void> {
    try {
      this.isLoading = true;
      const linkId = this.filterMode === 'containing' ? this.linkId : undefined;
      const response = await this.accounts.getCollections(1, 100, this.searchQuery, true, linkId);
      this.collections = response.results || [];
    } catch (error) {
      console.error('Failed to load collections:', error);
    } finally {
      this.isLoading = false;
    }
  }

  setFilterMode(mode: 'all' | 'containing'): void {
    if (this.filterMode !== mode) {
      this.filterMode = mode;
      this.loadCollections();
    }
  }

  searchCollections(): void {
    this.loadCollections();
  }

  isSessionInCollection(collection: Collection): boolean {
    if (!collection.accessible_curtains || collection.accessible_curtains.length === 0) {
      return false;
    }
    return collection.accessible_curtains.some(curtain => curtain.link_id === this.linkId);
  }

  async toggleCollection(collection: Collection): Promise<void> {
    try {
      this.isLoading = true;
      if (this.isSessionInCollection(collection)) {
        await this.accounts.removeCurtainFromCollection(collection.id, this.linkId);
      } else {
        await this.accounts.addCurtainToCollection(collection.id, this.linkId);
      }
      await this.loadCollections();
    } catch (error) {
      console.error('Failed to toggle collection:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async createNewCollection(): Promise<void> {
    const name = prompt('Enter collection name:');
    if (name && name.trim()) {
      const description = prompt('Enter collection description (optional):');
      try {
        this.isLoading = true;
        await this.accounts.createCollection(name.trim(), description?.trim() || '');
        await this.loadCollections();
      } catch (error) {
        console.error('Failed to create collection:', error);
      } finally {
        this.isLoading = false;
      }
    }
  }

  isOwner(collection: Collection): boolean {
    return collection.owner_username === this.accounts.curtainAPI.user.username;
  }

  async toggleEnable(collection: Collection): Promise<void> {
    try {
      this.isLoading = true;
      const newEnable = !collection.enable;
      await this.accounts.updateCollectionEnable(collection.id, newEnable);
      collection.enable = newEnable;
      if (newEnable) {
        this.toast.show("Sharing Enabled", "Collection is now publicly shareable.");
      } else {
        this.toast.show("Sharing Disabled", "Collection is no longer publicly accessible.");
      }
    } catch (error) {
      console.error('Failed to toggle collection sharing:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getCollectionLink(collection: Collection): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/collection/${collection.id}`;
  }

  async copyCollectionLink(collection: Collection): Promise<void> {
    const link = this.getCollectionLink(collection);
    try {
      await navigator.clipboard.writeText(link);
      this.toast.show("Link Copied", "Collection link copied to clipboard.");
    } catch (error) {
      console.error('Failed to copy link:', error);
      this.toast.show("Error", "Failed to copy link to clipboard.");
    }
  }
}

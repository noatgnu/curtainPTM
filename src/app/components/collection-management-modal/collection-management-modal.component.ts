import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountsService } from '../../accounts/accounts.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Collection {
  id: number;
  name: string;
  description: string;
  curtain_count: number;
  curtains: string[];
  updated: Date;
  owner_username: string;
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
    private accounts: AccountsService
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
    return collection.curtains && collection.curtains.includes(this.linkId);
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
}

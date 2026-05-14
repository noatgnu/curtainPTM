import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountsService } from '../../accounts/accounts.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-collection-sessions-viewer-modal',
  imports: [CommonModule],
  templateUrl: './collection-sessions-viewer-modal.component.html',
  styleUrl: './collection-sessions-viewer-modal.component.scss',
})
export class CollectionSessionsViewerModalComponent implements OnInit {
  @Input() collectionId!: number;

  collection: any = null;
  sessions: any[] = [];
  isLoading: boolean = false;
  base: string = window.location.origin;

  constructor(
    public activeModal: NgbActiveModal,
    private accounts: AccountsService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadCollectionDetails();
  }

  async loadCollectionDetails(): Promise<void> {
    if (!this.collectionId) return;

    try {
      this.isLoading = true;
      const response = await this.accounts.curtainAPI.axiosInstance.get(
        this.accounts.curtainAPI.baseURL + `curtain-collections/${this.collectionId}/`
      );
      this.collection = response.data;
      this.sessions = this.collection?.accessible_curtains ?? [];
    } catch (error) {
      console.error('Failed to load collection details:', error);
    } finally {
      this.isLoading = false;
    }
  }
}

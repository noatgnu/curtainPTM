import { ChangeDetectorRef, Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AccountsService } from '../../accounts/accounts.service';
import { CommonModule } from '@angular/common';
import { CurtainCollection } from 'curtain-web-api';

@Component({
  selector: 'app-collection-sessions-viewer-modal',
  imports: [CommonModule],
  templateUrl: './collection-sessions-viewer-modal.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './collection-sessions-viewer-modal.component.scss',
})
export class CollectionSessionsViewerModalComponent implements OnInit {
  @Input() collectionId!: number;

  collection: CurtainCollection | null = null;
  sessions: any[] = [];
  isLoading: boolean = false;
  removingLinkId: string | null = null;
  base: string = window.location.origin;

  constructor(
    public activeModal: NgbActiveModal,
    private accounts: AccountsService,
    private cdr: ChangeDetectorRef
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
      this.cdr.detectChanges();
    }
  }

  get isOwner(): boolean {
    return !!this.collection && this.collection.owner_username === this.accounts.curtainAPI.user.username;
  }

  async removeSession(session: any): Promise<void> {
    if (!confirm(`Remove "${session.name || session.link_id}" from this collection?`)) {
      return;
    }

    try {
      this.removingLinkId = session.link_id;
      await this.accounts.removeCurtainFromCollection(this.collectionId, session.link_id);
      this.sessions = this.sessions.filter(s => s.link_id !== session.link_id);
    } catch (error) {
      console.error('Failed to remove session from collection:', error);
    } finally {
      this.removingLinkId = null;
      this.cdr.detectChanges();
    }
  }
}

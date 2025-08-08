import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountsService } from "../accounts.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: 'app-accounts',
    templateUrl: './accounts.component.html',
    styleUrls: ['./accounts.component.scss'],
    standalone: false
})
export class AccountsComponent implements OnInit, OnDestroy {
  data: { results: any[], count: number } = { results: [], count: 0 }
  form: FormGroup = this.fb.group({
    sessionDescription: [""],
  })
  currentPage: number = 1
  totalItems: number = 0
  pageNumber: number = 0
  base: string = window.location.origin
  descriptionTrigger: { [key: string]: boolean } = {}
  selectedLinks: { [key: string]: boolean } = {}
  selectedCount: number = 0
  private destroy$ = new Subject<void>()
  isLoading: boolean = false
  constructor(public accounts: AccountsService, private fb: FormBuilder) {
    this.initializeComponent();
  }

  ngOnInit(): void {
    // Component initialization is handled in constructor
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async initializeComponent(): Promise<void> {
    try {
      this.isLoading = true;
      await this.accounts.getUser();
      const data = await this.accounts.curtainAPI.getCurtainLinks(
        this.accounts.curtainAPI.user.username, 
        "", 
        undefined, 
        "PTM"
      );
      this.updateShowingLink(data);
    } catch (error) {
      console.error('Error initializing component:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async submit(page: number = 0): Promise<void> {
    try {
      this.isLoading = true;
      const searchTerm = this.form.value.sessionDescription || "";
      const data = await this.accounts.curtainAPI.getCurtainLinks(
        this.accounts.curtainAPI.user.username, 
        searchTerm, 
        page * 20, 
        "PTM"
      );
      this.updateShowingLink(data);
      this.currentPage = page + 1;
    } catch (error) {
      console.error('Error submitting search:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private updateShowingLink(data: any): void {
    if (data?.data?.results) {
      data.data.results = data.data.results.map((item: any) => {
        if (!(item.link_id in this.descriptionTrigger)) {
          this.descriptionTrigger[item.link_id] = false;
          this.selectedLinks[item.link_id] = false;
        }
        return {
          ...item,
          created: new Date(item.created)
        };
      });
      this.totalItems = data.data.count || 0;
      this.pageNumber = Math.ceil(this.totalItems / 20);
      this.data = data.data;
    }
  }

  async deleteLink(link_id: string): Promise<void> {
    try {
      await this.accounts.deleteCurtainLink(link_id);
      await this.refreshData();
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  }

  viewDescription(link_id: string): void {
    this.descriptionTrigger[link_id] = !this.descriptionTrigger[link_id];
  }

  addOrRemoveFromSelected(link: string): void {
    const wasSelected = this.selectedLinks[link] || false;
    this.selectedLinks[link] = !wasSelected;
    
    if (this.selectedLinks[link]) {
      this.selectedCount++;
    } else {
      this.selectedCount--;
    }
  }

  async addOwnerToLinks(owner: string): Promise<void> {
    if (!owner.trim()) return;
    
    try {
      const selectedIds = Object.keys(this.selectedLinks).filter(id => this.selectedLinks[id]);
      
      for (const linkId of selectedIds) {
        await this.accounts.curtainAPI.addOwner(linkId, owner);
      }
      
      await this.refreshData();
    } catch (error) {
      console.error('Error adding owner to links:', error);
    }
  }

  addOwnerToSelectedLinks(owner: string): void {
    this.addOwnerToLinks(owner);
  }

  async removeLinks(): Promise<void> {
    try {
      const selectedIds = Object.keys(this.selectedLinks).filter(id => this.selectedLinks[id]);
      
      for (const linkId of selectedIds) {
        await this.accounts.deleteCurtainLink(linkId);
      }
      
      this.resetSelection();
      await this.refreshData();
    } catch (error) {
      console.error('Error removing links:', error);
    }
  }

  removeSelectedLinks(): void {
    this.removeLinks();
  }

  async changePublicity(status: boolean): Promise<void> {
    try {
      const selectedIds = Object.keys(this.selectedLinks).filter(id => this.selectedLinks[id]);
      
      for (const linkId of selectedIds) {
        await this.accounts.curtainAPI.updateSession({ enable: status }, linkId);
      }
      
      await this.refreshData();
    } catch (error) {
      console.error('Error changing publicity:', error);
    }
  }
  
  changePublicitySelectedLinks(status: boolean): void {
    this.changePublicity(status);
  }
  
  private async refreshData(): Promise<void> {
    try {
      const searchTerm = this.form.value.sessionDescription || "";
      const [linkData] = await Promise.all([
        this.accounts.curtainAPI.getCurtainLinks(
          this.accounts.curtainAPI.user.username,
          searchTerm,
          (this.currentPage - 1) * 20,
          "PTM"
        ),
        this.accounts.getUser()
      ]);
      this.updateShowingLink(linkData);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }
  
  private resetSelection(): void {
    this.selectedLinks = {};
    this.selectedCount = 0;
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccountsService } from "../accounts.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, takeUntil } from "rxjs/operators";
import { ToastService } from "../../toast.service";

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
  errorMessage: string = ''
  activeTab: number = 1

  constructor(
    public accounts: AccountsService, 
    private fb: FormBuilder,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.form.controls['sessionDescription'].valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.submit(0);
    });
  }

  private async initializeComponent(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.accounts.getUser();
      const data = await this.accounts.curtainAPI.getCurtainLinks(
        this.accounts.curtainAPI.user.username,
        "",
        undefined,
        "PTM"
      );
      this.updateShowingLink(data);
    } catch (error) {
      this.errorMessage = 'Failed to load account information. Please try again.';
      console.error('Error initializing component:', error);
      this.toast.show("Error", "Failed to load account information").then();
    } finally {
      this.isLoading = false;
    }
  }

  async submit(page: number = 0): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
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
      this.errorMessage = 'Failed to search sessions. Please try again.';
      console.error('Error submitting search:', error);
      this.toast.show("Error", "Failed to search sessions").then();
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
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      this.isLoading = true;
      await this.accounts.deleteCurtainLink(link_id);
      await this.refreshData();
      this.toast.show("Success", "Session deleted successfully").then();
    } catch (error) {
      console.error('Error deleting link:', error);
      this.toast.show("Error", "Failed to delete session").then();
    } finally {
      this.isLoading = false;
    }
  }

  viewDescription(link_id: string): void {
    this.descriptionTrigger[link_id] = !this.descriptionTrigger[link_id];
  }

  toggleLinkSelection(link: string): void {
    const wasSelected = this.selectedLinks[link] || false;
    this.selectedLinks[link] = !wasSelected;
    this.selectedCount = Object.values(this.selectedLinks).filter(Boolean).length;
  }

  toggleSelectAll(): void {
    const allSelected = this.data.results.every(item => this.selectedLinks[item.link_id]);
    this.data.results.forEach(item => {
      this.selectedLinks[item.link_id] = !allSelected;
    });
    this.selectedCount = Object.values(this.selectedLinks).filter(Boolean).length;
  }

  async addOwnerToSelectedLinks(owner: string): Promise<void> {
    if (!owner.trim()) {
      this.toast.show("Warning", "Please enter a valid username").then();
      return;
    }

    const selectedIds = Object.keys(this.selectedLinks).filter(id => this.selectedLinks[id]);
    if (selectedIds.length === 0) {
      this.toast.show("Warning", "Please select at least one session").then();
      return;
    }

    try {
      this.isLoading = true;
      for (const linkId of selectedIds) {
        await this.accounts.curtainAPI.addOwner(linkId, owner);
      }
      await this.refreshData();
      this.toast.show("Success", `Owner "${owner}" added to ${selectedIds.length} session(s)`).then();
    } catch (error) {
      console.error('Error adding owner to links:', error);
      this.toast.show("Error", "Failed to add owner to sessions").then();
    } finally {
      this.isLoading = false;
    }
  }

  async removeSelectedLinks(): Promise<void> {
    const selectedIds = Object.keys(this.selectedLinks).filter(id => this.selectedLinks[id]);
    if (selectedIds.length === 0) {
      this.toast.show("Warning", "Please select at least one session").then();
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} session(s)?`)) {
      return;
    }

    try {
      this.isLoading = true;
      for (const linkId of selectedIds) {
        await this.accounts.deleteCurtainLink(linkId);
      }
      this.resetSelection();
      await this.refreshData();
      this.toast.show("Success", `${selectedIds.length} session(s) deleted successfully`).then();
    } catch (error) {
      console.error('Error removing links:', error);
      this.toast.show("Error", "Failed to delete sessions").then();
    } finally {
      this.isLoading = false;
    }
  }

  async changePublicitySelectedLinks(status: boolean): Promise<void> {
    const selectedIds = Object.keys(this.selectedLinks).filter(id => this.selectedLinks[id]);
    if (selectedIds.length === 0) {
      this.toast.show("Warning", "Please select at least one session").then();
      return;
    }

    try {
      this.isLoading = true;
      for (const linkId of selectedIds) {
        await this.accounts.curtainAPI.updateSession({ enable: status }, linkId);
      }
      await this.refreshData();
      const statusText = status ? "public" : "private";
      this.toast.show("Success", `${selectedIds.length} session(s) set to ${statusText}`).then();
    } catch (error) {
      console.error('Error changing publicity:', error);
      this.toast.show("Error", "Failed to change session publicity").then();
    } finally {
      this.isLoading = false;
    }
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
      this.toast.show("Error", "Failed to refresh data").then();
    }
  }

  private resetSelection(): void {
    this.selectedLinks = {};
    this.selectedCount = 0;
  }

  get hasSelectedLinks(): boolean {
    return this.selectedCount > 0;
  }

  get allSelected(): boolean {
    return this.data.results.length > 0 && 
           this.data.results.every(item => this.selectedLinks[item.link_id]);
  }
}

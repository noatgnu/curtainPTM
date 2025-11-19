import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { AccountsService } from '../accounts.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

interface DataFilterList {
  id: number;
  name: string;
  data: string;
  category: string;
  created: Date;
  user: number;
  [key: string]: any;
}

interface ApiResponse<T = any> {
  data: {
    results: T[];
    count: number;
  };
  code?: string;
  message?: string;
}

interface PaginationData {
  results: DataFilterList[];
  count: number;
}

interface SelectedListsState {
  [id: number]: boolean;
}

interface ApiError {
  code?: string;
  message?: string;
  status?: number;
}

@Component({
  selector: 'app-user-lists-management',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgbPagination
  ],
  templateUrl: './user-lists-management.component.html',
  styleUrl: './user-lists-management.component.scss'
})
export class UserListsManagementComponent implements OnInit, OnDestroy {
  data: PaginationData = { results: [], count: 0 };
  searchForm!: FormGroup;
  currentPage = signal(1);
  totalItems = signal(0);
  pageNumber = computed(() => Math.ceil(this.totalItems() / this.ITEMS_PER_PAGE));
  selectedLists: SelectedListsState = {};
  selectedCount = signal(0);
  isLoading = signal(false);
  expandedList = signal<{ [id: number]: boolean }>({});
  editingList = signal<{ [id: number]: boolean }>({});
  editForms: { [id: number]: { name: string; data: string; category: string } } = {};

  private readonly destroy$ = new Subject<void>();
  private readonly ITEMS_PER_PAGE = 20;

  constructor(
    public accounts: AccountsService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      searchTerm: ['']
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadUserLists();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadUserLists(page: number = 1): Promise<void> {
    try {
      this.isLoading.set(true);
      const searchTerm = this.searchForm.get('searchTerm')?.value || '';
      const offset = Math.max(0, (page - 1)) * this.ITEMS_PER_PAGE;

      const response = await this.accounts.curtainAPI.getDataFilterList(
        '',
        searchTerm,
        "User's Lists",
        this.ITEMS_PER_PAGE,
        offset
      );

      this.updateListData(response);
      this.currentPage.set(page);
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading.set(false);
    }
  }

  async submit(page: number = 1): Promise<void> {
    await this.loadUserLists(page);
  }

  private updateListData(response: ApiResponse<DataFilterList>): void {
    if (!response?.data?.results) {
      console.warn('Invalid response data structure');
      return;
    }

    const processedResults = response.data.results.map((list): DataFilterList => {
      if (!(list.id in this.selectedLists)) {
        this.selectedLists[list.id] = false;
      }

      const createdDate = list.created ? new Date(list.created) : new Date();
      if (isNaN(createdDate.getTime())) {
        console.warn(`Invalid date for list ${list.id}`);
      }

      return {
        ...list,
        created: createdDate
      };
    });

    const count = response.data.count ?? 0;
    this.totalItems.set(count);
    this.data = {
      results: processedResults,
      count: count
    };
  }

  async deleteList(id: number): Promise<void> {
    if (!confirm('Are you sure you want to delete this list?')) {
      return;
    }

    try {
      this.isLoading.set(true);
      await this.accounts.curtainAPI.deleteDataFilterList(id);

      delete this.selectedLists[id];
      this.expandedList.update(state => {
        const newState = { ...state };
        delete newState[id];
        return newState;
      });
      this.updateSelectedCount();

      await this.loadUserLists(this.currentPage());
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleListExpansion(id: number): void {
    this.expandedList.update(state => ({
      ...state,
      [id]: !state[id]
    }));
  }

  startEditing(list: DataFilterList): void {
    this.editingList.update(state => ({
      ...state,
      [list.id]: true
    }));
    this.editForms[list.id] = {
      name: list.name,
      data: list.data,
      category: "User's Lists"
    };
  }

  cancelEditing(id: number): void {
    this.editingList.update(state => {
      const newState = { ...state };
      delete newState[id];
      return newState;
    });
    delete this.editForms[id];
  }

  async saveList(id: number): Promise<void> {
    if (!this.editForms[id]) {
      return;
    }

    const form = this.editForms[id];
    if (!form.name || !form.data) {
      console.warn('Name and data are required');
      return;
    }

    try {
      this.isLoading.set(true);
      await this.accounts.curtainAPI.updateDataFilterList(
        id,
        form.name,
        form.data,
        form.category
      );

      this.editingList.update(state => {
        const newState = { ...state };
        delete newState[id];
        return newState;
      });
      delete this.editForms[id];

      await this.loadUserLists(this.currentPage());
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleSelection(id: number): void {
    if (id in this.selectedLists) {
      this.selectedLists[id] = !this.selectedLists[id];
    } else {
      this.selectedLists[id] = true;
    }

    this.updateSelectedCount();
  }

  toggleSelectAll(): void {
    const allSelected = this.selectedCount() === this.data.results.length && this.data.results.length > 0;

    this.data.results.forEach(list => {
      this.selectedLists[list.id] = !allSelected;
    });

    this.updateSelectedCount();
  }

  private updateSelectedCount(): void {
    this.selectedCount.set(Object.values(this.selectedLists).filter(Boolean).length);
  }

  async removeSelectedLists(): Promise<void> {
    const selectedIds = this.getSelectedListIds();
    if (selectedIds.length === 0) {
      console.warn('No lists selected for removal');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} list(s)?`)) {
      return;
    }

    try {
      this.isLoading.set(true);

      await Promise.all(
        selectedIds.map(id =>
          this.accounts.curtainAPI.deleteDataFilterList(id)
        )
      );

      selectedIds.forEach(id => {
        delete this.selectedLists[id];
      });

      this.expandedList.update(state => {
        const newState = { ...state };
        selectedIds.forEach(id => {
          delete newState[id];
        });
        return newState;
      });

      this.updateSelectedCount();
      await this.loadUserLists(this.currentPage());
    } catch (error) {
      await this.handleApiError(error as ApiError);
    } finally {
      this.isLoading.set(false);
    }
  }

  private getSelectedListIds(): number[] {
    return Object.entries(this.selectedLists)
      .filter(([_, isSelected]) => isSelected === true)
      .map(([id, _]) => parseInt(id, 10));
  }

  getPreview(data: string, maxLength: number = 100): string {
    if (!data) return '';
    const lines = data.split('\n').filter(line => line.trim());
    const preview = lines.slice(0, 3).join(', ');
    return preview.length > maxLength ? preview.substring(0, maxLength) + '...' : preview;
  }

  getLineCount(data: string): number {
    if (!data) return 0;
    return data.split('\n').filter(line => line.trim()).length;
  }

  private async handleApiError(error: ApiError): Promise<void> {
    console.error('API Error:', error);

    if (error.code === 'token_not_valid') {
      try {
        await this.accounts.logout();
      } catch (logoutError) {
        console.error('Logout failed:', logoutError);
      }
    }

    console.error(`Operation failed: ${error.message ?? 'Unknown error'}`);
  }
}

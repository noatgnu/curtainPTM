import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SaveStateService } from '../../save-state.service';
import { StateMigrationService } from '../../state-migration.service';
import { SavedState, STATE_CATEGORIES, StateCategory, CURRENT_STATE_VERSION } from '../../interfaces/saved-state.interface';

@Component({
  selector: 'app-selective-import-dialog',
  standalone: false,
  templateUrl: './selective-import-dialog.component.html',
  styleUrls: ['./selective-import-dialog.component.scss'],
})
export class SelectiveImportDialogComponent implements OnInit {
  @Input() fileContent: string = '';
  parsedState: SavedState | null = null;
  parseError: string = '';
  isOldFormat: boolean = false;
  categories: StateCategory[] = STATE_CATEGORIES;
  selectedCategories: { [key: string]: boolean } = {};

  constructor(
    private modal: NgbActiveModal,
    private saveState: SaveStateService,
    private migration: StateMigrationService
  ) {}

  ngOnInit(): void {
    this.parseFile();
    for (const cat of this.categories) {
      this.selectedCategories[cat.key] = true;
    }
  }

  parseFile(): void {
    try {
      const parsed = JSON.parse(this.fileContent);
      this.isOldFormat = this.migration.isOldFormat(parsed);
      if (this.isOldFormat) {
        this.parsedState = this.migration.upgradeState(parsed, CURRENT_STATE_VERSION);
      } else {
        this.parsedState = parsed;
      }
    } catch (e) {
      this.parseError = 'Invalid JSON file format';
    }
  }

  getSelectedCategoryKeys(): string[] {
    return Object.keys(this.selectedCategories).filter(key => this.selectedCategories[key]);
  }

  isAllCategoriesSelected(): boolean {
    return this.categories.every(cat => this.selectedCategories[cat.key]);
  }

  importAll(): void {
    if (this.parsedState) {
      this.saveState.loadStateFromObject(this.parsedState);
      this.modal.close({ type: 'all' });
    }
  }

  importSelected(): void {
    if (this.parsedState) {
      const selectedKeys = this.getSelectedCategoryKeys();
      this.saveState.loadSelectiveState(this.parsedState, selectedKeys);
      this.modal.close({ type: 'selective', categories: selectedKeys });
    }
  }

  cancel(): void {
    this.modal.dismiss();
  }

  getCategoryHasData(cat: StateCategory): boolean {
    if (!this.parsedState) return false;

    if (cat.isDataCategory) {
      const hasSelectedMap = this.parsedState.data.selectedMap && Object.keys(this.parsedState.data.selectedMap).length > 0;
      const hasSelected = this.parsedState.data.selected && this.parsedState.data.selected.length > 0;
      const hasOperationNames = this.parsedState.data.selectOperationNames && this.parsedState.data.selectOperationNames.length > 0;
      return hasSelectedMap || hasSelected || hasOperationNames;
    }

    for (const key of cat.settingsKeys) {
      if (key in this.parsedState.settings) {
        const value = (this.parsedState.settings as any)[key];
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && Object.keys(value).length > 0) {
            return true;
          } else if (typeof value !== 'object') {
            return true;
          }
        }
      }
    }
    return false;
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

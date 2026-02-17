import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SaveStateService } from '../../save-state.service';
import { STATE_CATEGORIES, StateCategory } from '../../interfaces/saved-state.interface';

@Component({
  selector: 'app-state-save-dialog',
  standalone: false,
  templateUrl: './state-save-dialog.component.html',
  styleUrls: ['./state-save-dialog.component.scss'],
})
export class StateSaveDialogComponent implements OnInit {
  name: string = '';
  description: string = '';
  tags: string[] = [];
  newTag: string = '';
  existingTags: string[] = [];
  categories: StateCategory[] = STATE_CATEGORIES;
  selectedCategories: { [key: string]: boolean } = {};

  constructor(
    private modal: NgbActiveModal,
    private saveState: SaveStateService
  ) {}

  ngOnInit(): void {
    this.existingTags = this.saveState.getAllTags();
    for (const cat of this.categories) {
      this.selectedCategories[cat.key] = true;
    }
  }

  addTag(): void {
    const tag = this.newTag.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.newTag = '';
    }
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }

  selectExistingTag(tag: string): void {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  getSelectedCategoryKeys(): string[] {
    return Object.keys(this.selectedCategories).filter(key => this.selectedCategories[key]);
  }

  isAllCategoriesSelected(): boolean {
    return this.categories.every(cat => this.selectedCategories[cat.key]);
  }

  save(): void {
    const selectedKeys = this.getSelectedCategoryKeys();
    const isAllSelected = this.isAllCategoriesSelected();

    if (isAllSelected) {
      const stateId = this.saveState.saveStateWithMetadata(this.name, this.description, this.tags);
      this.modal.close({ stateId, isSelective: false });
    } else {
      const selectiveState = this.saveState.createSelectiveState(selectedKeys);
      selectiveState.name = this.name || `State #${selectiveState.id}`;
      selectiveState.description = this.description;
      selectiveState.tags = this.tags;

      let stateNumber = localStorage.getItem("SaveStateNumber");
      if (!stateNumber) {
        localStorage.setItem("SaveStateNumber", "0");
        stateNumber = "0";
      }
      selectiveState.id = stateNumber;
      localStorage.setItem("SaveState" + stateNumber, JSON.stringify(selectiveState));
      localStorage.setItem("SaveStateNumber", (parseInt(stateNumber) + 1).toString());
      this.saveState.states = this.saveState.getAvailableStates();

      this.modal.close({ stateId: stateNumber, isSelective: true });
    }
  }

  cancel(): void {
    this.modal.dismiss();
  }
}

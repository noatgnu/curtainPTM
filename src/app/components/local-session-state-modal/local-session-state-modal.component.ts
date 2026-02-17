import { Component, OnInit } from '@angular/core';
import { SaveStateService } from "../../save-state.service";
import { AutoSaveService } from "../../auto-save.service";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { SavedState, ExportOptions, STATE_CATEGORIES, StateCategory } from '../../interfaces/saved-state.interface';
import { StateSaveDialogComponent } from '../state-save-dialog/state-save-dialog.component';
import { SelectiveImportDialogComponent } from '../selective-import-dialog/selective-import-dialog.component';

@Component({
  selector: 'app-local-session-state-modal',
  templateUrl: './local-session-state-modal.component.html',
  styleUrls: ['./local-session-state-modal.component.scss'],
  standalone: false
})
export class LocalSessionStateModalComponent implements OnInit {
  states: SavedState[] = [];
  autoSaves: SavedState[] = [];
  showAutoSaves: boolean = false;
  filterTag: string = '';
  availableTags: string[] = [];
  autoSaveEnabled: boolean = false;
  autoSaveInterval: number = 5;
  hoveredStateId: string | number | null = null;
  categories: StateCategory[] = STATE_CATEGORIES;
  exportOptions: ExportOptions = { pretty: true };
  showExportOptions: { [key: string]: boolean } = {};

  constructor(
    private saveState: SaveStateService,
    private autoSaveService: AutoSaveService,
    private modal: NgbActiveModal,
    private modalService: NgbModal
  ) {
    this.getStates();
  }

  ngOnInit(): void {
    this.autoSaveEnabled = this.autoSaveService.isEnabled();
    this.autoSaveInterval = this.autoSaveService.getIntervalMinutes();
    this.availableTags = this.saveState.getAllTags();
    this.autoSaves = this.saveState.getAutoSaves();
  }

  loadState(stateNumber: number): void {
    this.saveState.loadState(stateNumber);
    this.modal.dismiss();
  }

  downloadState(stateNumber: number): void {
    this.saveState.downloadState(stateNumber);
  }

  downloadStateWithOptions(stateNumber: number, options: ExportOptions): void {
    this.saveState.downloadStateWithOptions(stateNumber, options);
    this.showExportOptions[stateNumber] = false;
  }

  deleteState(stateNumber: number): void {
    this.saveState.removeState(stateNumber);
    this.getStates();
  }

  getStates(): void {
    this.states = [];
    for (const i of this.saveState.states) {
      const state = this.saveState.getSaveState(i);
      if (state) {
        this.states = [state].concat(this.states);
      }
    }
    this.availableTags = this.saveState.getAllTags();
  }

  getFilteredStates(): SavedState[] {
    if (!this.filterTag) {
      return this.states;
    }
    return this.states.filter(s => s.tags && s.tags.includes(this.filterTag));
  }

  close(): void {
    this.modal.dismiss();
  }

  openSaveDialog(): void {
    const modalRef = this.modalService.open(StateSaveDialogComponent, { size: 'lg' });
    modalRef.result.then(() => {
      this.getStates();
    }).catch(() => {});
  }

  loadFromFile(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target?.result;
        if (contents) {
          const modalRef = this.modalService.open(SelectiveImportDialogComponent, { size: 'lg' });
          modalRef.componentInstance.fileContent = contents.toString();
          modalRef.result.then(() => {
            this.modal.dismiss();
          }).catch(() => {});
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  }

  toggleAutoSave(): void {
    if (this.autoSaveEnabled) {
      this.autoSaveService.stopAutoSave();
    } else {
      this.autoSaveService.startAutoSave();
    }
    this.autoSaveEnabled = this.autoSaveService.isEnabled();
  }

  updateAutoSaveInterval(): void {
    this.autoSaveService.setInterval(this.autoSaveInterval);
  }

  loadAutoSave(autoSaveKey: string): void {
    this.saveState.loadAutoSave(autoSaveKey);
    this.modal.dismiss();
  }

  deleteAutoSave(autoSaveKey: string): void {
    this.saveState.deleteAutoSave(autoSaveKey);
    this.autoSaves = this.saveState.getAutoSaves();
  }

  toggleExportOptions(stateId: string | number): void {
    this.showExportOptions[stateId] = !this.showExportOptions[stateId];
  }

  getRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  clearFilter(): void {
    this.filterTag = '';
  }
}

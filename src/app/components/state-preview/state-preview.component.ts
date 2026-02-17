import { Component, Input, OnInit } from '@angular/core';
import { StatePreview, CategorySummary } from '../../interfaces/saved-state.interface';
import { SaveStateService } from '../../save-state.service';

@Component({
  selector: 'app-state-preview',
  standalone: false,
  templateUrl: './state-preview.component.html',
  styleUrls: ['./state-preview.component.scss'],
})
export class StatePreviewComponent implements OnInit {
  @Input() stateNumber: number = -1;
  preview: StatePreview | null = null;

  constructor(private saveState: SaveStateService) {}

  ngOnInit(): void {
    if (this.stateNumber >= 0) {
      this.preview = this.saveState.getStatePreview(this.stateNumber);
    }
  }

  getCategoriesWithData(): CategorySummary[] {
    if (!this.preview) return [];
    return this.preview.categorySummary.filter(cs => cs.hasData);
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

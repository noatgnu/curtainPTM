import {Component, Input, OnInit} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {SettingsService} from '../../../settings.service';

interface TraceItem {
  name: string;
  color: string;
  originalIndex: number;
}

@Component({
  selector: 'app-reorder-traces-modal',
  templateUrl: './reorder-traces-modal.component.html',
  styleUrls: ['./reorder-traces-modal.component.scss'],
  standalone: false
})
export class ReorderTracesModalComponent implements OnInit {
  @Input() traces: any[] = []
  traceItems: TraceItem[] = []

  constructor(
    public modal: NgbActiveModal,
    private settings: SettingsService
  ) {}

  ngOnInit(): void {
    this.initializeTraceOrder()
  }

  initializeTraceOrder() {
    this.traceItems = this.traces.map((trace, index) => ({
      name: trace.name,
      color: this.getTraceColor(trace),
      originalIndex: index
    })).reverse()
  }

  getTraceColor(trace: any): string {
    if (trace.marker && trace.marker.color) {
      return trace.marker.color
    }
    return '#999999'
  }

  drop(event: CdkDragDrop<TraceItem[]>) {
    moveItemInArray(this.traceItems, event.previousIndex, event.currentIndex)
  }

  save() {
    const order = this.traceItems.map(item => item.name).reverse()
    this.settings.settings.volcanoTraceOrder = order
    this.modal.close(order)
  }

  reset() {
    this.settings.settings.volcanoTraceOrder = []
    this.modal.close([])
  }

  cancel() {
    this.modal.dismiss()
  }
}

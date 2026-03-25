import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, EventEmitter, Input, Output } from '@angular/core';
import { NgbProgressbar } from "@ng-bootstrap/ng-bootstrap";
import { DataService } from "../../../data.service";
import { ToastType } from "../../../toast.service";

@Component({
    selector: 'app-toast-progressbar',
    imports: [
        NgbProgressbar
    ],
    templateUrl: './toast-progressbar.component.html',
    styleUrl: './toast-progressbar.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastProgressbarComponent {
  progress = 0;

  @Input() total = 100;
  @Input() toastType: ToastType = 'info';
  @Input() action = 'other';
  @Output() finished: EventEmitter<boolean> = new EventEmitter();

  get progressBarType(): string {
    const typeMap: Record<ToastType, string> = {
      info: 'primary',
      success: 'success',
      warning: 'warning',
      error: 'danger'
    };
    return typeMap[this.toastType] || 'primary';
  }

  constructor(private data: DataService, private cdr: ChangeDetectorRef) {
    effect(() => {
      const downloadProgress = this.data.downloadProgress();
      if (this.action === 'download') {
        this.progress = downloadProgress;
        this.cdr.markForCheck();
        if (downloadProgress === 100) {
          this.finished.emit(true);
        }
      }
    });

    effect(() => {
      const uploadProgress = this.data.uploadProgress();
      if (this.action === 'upload') {
        this.progress = uploadProgress;
        this.cdr.markForCheck();
        if (uploadProgress === 100) {
          this.finished.emit(true);
        }
      }
    });

    effect(() => {
      const processingProgress = this.data.processingProgress();
      if (this.action === 'processing') {
        this.progress = processingProgress;
        this.cdr.markForCheck();
        if (processingProgress === 100) {
          this.finished.emit(true);
        }
      }
    });
  }
}

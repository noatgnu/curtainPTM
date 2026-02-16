import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { NgbProgressbar } from "@ng-bootstrap/ng-bootstrap";
import { DataService } from "../../../data.service";
import { Subscription } from "rxjs";
import { ToastType } from "../../../toast.service";

@Component({
    selector: 'app-toast-progressbar',
    imports: [
        NgbProgressbar
    ],
    templateUrl: './toast-progressbar.component.html',
    styleUrl: './toast-progressbar.component.scss'
})
export class ToastProgressbarComponent implements OnDestroy {
  private subscription?: Subscription;
  progress = 0;

  @Input() total = 100;
  @Input() toastType: ToastType = 'info';
  @Output() finished: EventEmitter<boolean> = new EventEmitter();

  private _action = 'other';

  @Input() set action(value: string) {
    this._action = value;
    this.cleanup();

    if (value === 'download') {
      this.subscription = this.data.downloadProgress.subscribe((progress) => {
        this.progress = progress;
        if (progress === 100) {
          this.finished.emit(true);
        }
      });
    } else if (value === 'upload') {
      this.subscription = this.data.uploadProgress.subscribe((progress) => {
        this.progress = progress;
        if (progress === 100) {
          this.finished.emit(true);
        }
      });
    }
  }

  get action(): string {
    return this._action;
  }

  get progressBarType(): string {
    const typeMap: Record<ToastType, string> = {
      info: 'primary',
      success: 'success',
      warning: 'warning',
      error: 'danger'
    };
    return typeMap[this.toastType] || 'primary';
  }

  constructor(private data: DataService) {}

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = undefined;
    }
  }
}

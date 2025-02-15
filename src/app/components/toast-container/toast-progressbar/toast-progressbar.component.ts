import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";
import {DataService} from "../../../data.service";

@Component({
  selector: 'app-toast-progressbar',
  standalone: true,
  imports: [
    NgbProgressbar
  ],
  templateUrl: './toast-progressbar.component.html',
  styleUrl: './toast-progressbar.component.scss'
})
export class ToastProgressbarComponent {
  private _action: string = "other"
  @Input() set action(value: string) {
    this._action = value
    if (value === "download") {
      this.data.downloadProgress.subscribe((data) => {
        this.progress = data
        if (data === 100) {
          this.finished.emit(true)
        }
      })
    } else if (value === "upload") {
      this.data.uploadProgress.subscribe((data) => {
        this.progress = data
        if (data === 100) {
          this.finished.emit(true)
        }
      })
    }
  }

  get action(): string {
    return this._action
  }
  @Input() progress: number = 0
  @Input() total: number = 100
  @Output() finished: EventEmitter<boolean> = new EventEmitter()

  constructor(public data: DataService) {

  }
}

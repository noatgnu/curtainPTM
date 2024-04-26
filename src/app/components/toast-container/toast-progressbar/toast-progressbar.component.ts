import {Component, Input} from '@angular/core';
import {NgbProgressbar} from "@ng-bootstrap/ng-bootstrap";

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
  @Input() progress: number = 0
  @Input() total: number = 0
  intervalStats?: any
  constructor() {
    this.intervalStats = setInterval(() => {
      if (this.intervalStats && this.progress >= this.total) {
        clearInterval(this.intervalStats)
      }
      this.progress += 100
    }, 100)
  }
}

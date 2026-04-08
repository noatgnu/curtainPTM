import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-uniprot-error-modal',
  templateUrl: './uniprot-error-modal.component.html',
  styleUrl: './uniprot-error-modal.component.scss',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UniprotErrorModalComponent {
  @Input() errorMessage: string = '';

  constructor(public activeModal: NgbActiveModal) {}

  continueWithoutUniprot(): void {
    this.activeModal.close(true);
  }

  cancel(): void {
    this.activeModal.close(false);
  }
}

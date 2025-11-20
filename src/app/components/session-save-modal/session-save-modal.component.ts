import { Component, Input, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SiteProperties } from 'curtain-web-api';

export interface SessionSaveOptions {
  permanent: boolean;
  expiryDuration?: number;
}

@Component({
  selector: 'app-session-save-modal',
  imports: [CommonModule, FormsModule],
  templateUrl: './session-save-modal.component.html',
  styleUrl: './session-save-modal.component.scss',
})
export class SessionSaveModalComponent {
  @Input() siteProperties!: SiteProperties;

  permanent = signal(false);
  expiryDuration = signal<number | undefined>(undefined);

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (this.siteProperties) {
      this.expiryDuration.set(this.siteProperties.default_expiry_duration_months);
    }
  }

  save() {
    const options: SessionSaveOptions = {
      permanent: this.permanent(),
      expiryDuration: this.permanent() ? undefined : this.expiryDuration()
    };
    this.activeModal.close(options);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}

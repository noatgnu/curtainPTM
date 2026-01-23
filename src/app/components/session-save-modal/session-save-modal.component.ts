import { Component, Input, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { FormsModule } from '@angular/forms';
import { SiteProperties } from 'curtain-web-api';

export interface SessionSaveOptions {
  permanent: boolean;
  expiryDuration?: number;
  sessionName?: string;
}

@Component({
  selector: 'app-session-save-modal',
  imports: [FormsModule],
  templateUrl: './session-save-modal.component.html',
  styleUrl: './session-save-modal.component.scss',
})
export class SessionSaveModalComponent {
  @Input() siteProperties!: SiteProperties;
  @Input() isStaff: boolean = false;
  @Input() currentName: string = '';

  permanent = signal(false);
  expiryDuration = signal<number | undefined>(undefined);
  sessionName = signal('');

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit() {
    if (this.siteProperties) {
      this.expiryDuration.set(this.siteProperties.default_expiry_duration_months);
    }
    if (this.currentName) {
      this.sessionName.set(this.currentName);
    }
  }

  save() {
    const options: SessionSaveOptions = {
      permanent: this.permanent(),
      expiryDuration: this.permanent() ? undefined : this.expiryDuration(),
      sessionName: this.sessionName() || undefined
    };
    this.activeModal.close(options);
  }

  cancel() {
    this.activeModal.dismiss();
  }
}

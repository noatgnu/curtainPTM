import { Component, OnInit, signal } from '@angular/core';
import {NgbActiveModal, NgbAlert} from "@ng-bootstrap/ng-bootstrap";
import {FormBuilder, FormControl, ReactiveFormsModule, Validators} from "@angular/forms";
import {AccountsService} from "../../accounts/accounts.service";
import {ToastService} from "../../toast.service";
import {CreatePermanentLinkRequest, PermanentLinkRequest} from "curtain-web-api";
import {DataService} from "../../data.service";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-permanent-link-request-modal',
  imports: [
    ReactiveFormsModule,
    NgbAlert,
    DatePipe
  ],
  templateUrl: './permanent-link-request-modal.component.html',
  styleUrl: './permanent-link-request-modal.component.scss',
})
export class PermanentLinkRequestModalComponent implements OnInit {
  curtainId: number = 0
  existingRequests = signal<PermanentLinkRequest[]>([])
  loading = signal(true)

  form = this.fb.group({
    request_type: new FormControl<'permanent' | 'extend'>('permanent', Validators.required),
    requested_expiry_months: new FormControl<number | null>(null),
    reason: new FormControl<string>('', Validators.required)
  })

  expiryOptions: number[] = []

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private accounts: AccountsService,
    private toast: ToastService,
    public data: DataService
  ) {}

  ngOnInit() {
    this.loadExpiryOptions()
    this.loadExistingRequests()

    this.form.get('request_type')?.valueChanges.subscribe(value => {
      const expiryControl = this.form.get('requested_expiry_months')
      if (value === 'extend') {
        expiryControl?.setValidators([Validators.required])
      } else {
        expiryControl?.clearValidators()
        expiryControl?.setValue(null)
      }
      expiryControl?.updateValueAndValidity()
    })
  }

  loadExpiryOptions() {
    this.accounts.curtainAPI.getSiteProperties().then(response => {
      if (response.data) {
        this.expiryOptions = response.data.expiry_duration_options || []
      }
    })
  }

  loadExistingRequests() {
    if (this.curtainId) {
      this.loading.set(true)
      this.accounts.curtainAPI.getPermanentLinkRequests(10, 0, undefined, this.curtainId).then(response => {
        if (response.data) {
          this.existingRequests.set(response.data.results)
        }
        this.loading.set(false)
      }).catch(err => {
        console.error('Failed to load requests:', err)
        this.loading.set(false)
      })
    }
  }

  submitRequest() {
    if (this.form.valid && this.curtainId) {
      const formValue = this.form.value
      const request: CreatePermanentLinkRequest = {
        curtain: this.curtainId,
        request_type: formValue.request_type as 'permanent' | 'extend',
        reason: formValue.reason || ''
      }

      if (formValue.request_type === 'extend' && formValue.requested_expiry_months) {
        request.requested_expiry_months = formValue.requested_expiry_months
      }

      this.accounts.curtainAPI.createPermanentLinkRequest(request).then(response => {
        this.toast.show('Request Submitted', 'Your request has been submitted and is pending review')
        this.form.reset()
        this.loadExistingRequests()
      }).catch(err => {
        console.error('Failed to submit request:', err)
        this.toast.show('Error', 'Failed to submit request. Please try again.')
      })
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'bg-warning'
      case 'approved':
        return 'bg-success'
      case 'rejected':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  getRequestTypeLabel(type: string): string {
    return type === 'permanent' ? 'Make Permanent' : 'Extend Expiry'
  }

  close() {
    this.activeModal.dismiss()
  }
}

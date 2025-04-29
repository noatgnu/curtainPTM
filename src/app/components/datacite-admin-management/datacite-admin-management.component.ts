import { Component } from '@angular/core';
import {
  NgbActiveModal,
  NgbNav,
  NgbNavContent, NgbNavItem,
  NgbNavLinkButton, NgbNavOutlet,
  NgbPagination,
  NgbTooltip
} from "@ng-bootstrap/ng-bootstrap";
import {AccountsService} from "../../accounts/accounts.service";
import {DataCiteCurtain} from "../../data-cite-metadata";
import {FormBuilder, ReactiveFormsModule} from "@angular/forms";

@Component({
  selector: 'app-datacite-admin-management',
  imports: [
    NgbPagination,
    NgbTooltip,
    NgbNav,
    NgbNavContent,
    NgbNavLinkButton,
    NgbNavItem,
    NgbNavOutlet,
    ReactiveFormsModule
  ],
  templateUrl: './datacite-admin-management.component.html',
  styleUrl: './datacite-admin-management.component.scss'
})
export class DataciteAdminManagementComponent {
  activeID = "user"
  page = 1
  pageSize = 10
  dataCiteDraftQuery?: {
    results: DataCiteCurtain[],
    count: number,
    next: string|null,
    previous: string|null
  }

  searchForm = this.fb.group({
    searchTerm: [""]
  })

  constructor(public activeModal: NgbActiveModal, public accountService: AccountsService, private fb: FormBuilder) {
    this.accountService.curtainAPI.getDataCites(undefined, undefined, undefined, this.pageSize, this.page-1, false, "TP").then(
      (data) => {
        this.dataCiteDraftQuery = data.data
      }
    )
    this.searchForm.controls.searchTerm.valueChanges.subscribe((value) => {
      this.changed(this.activeID, value)
    })
  }

  close() {
    this.activeModal.dismiss()
  }


  approveDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.changeDataCiteStatus(datacite.id, "published").then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.status = "published"
          }
          return dc
        })
      }
    })
  }

  rejectDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.changeDataCiteStatus(datacite.id, "rejected").then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.status = "rejected"
          }
          return dc
        })
      }
    })
  }

  lockDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.lockDataCite(datacite.id, true).then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.lock = true
          }
          return dc
        })
      }
    })
  }

  unlockDOI(datacite: DataCiteCurtain) {
    this.accountService.curtainAPI.lockDataCite(datacite.id, false).then((data: any) => {
      if (this.dataCiteDraftQuery) {
        this.dataCiteDraftQuery.results = this.dataCiteDraftQuery.results.map((dc) => {
          if (dc.id === datacite.id) {
            dc.lock = false
          }
          return dc
        })
      }
    })
  }

  changed(event: any, term: string|null|undefined) {
    this.dataCiteDraftQuery = undefined
    if (!term) {
      term = undefined
    }
    if (event === "admin") {
      if (this.searchForm.value.searchTerm) {
        this.accountService.curtainAPI.getDataCites(undefined, term, "draft", this.pageSize, this.page-1, true, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
          }
        )
      } else {
        this.accountService.curtainAPI.getDataCites(undefined, undefined, "draft", this.pageSize, this.page-1, true, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
          }
        )
      }
    } else {
      if (this.searchForm.value.searchTerm) {
        this.accountService.curtainAPI.getDataCites(undefined, term, undefined, this.pageSize, this.page-1, false, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
          }
        )
      } else {
        this.accountService.curtainAPI.getDataCites(undefined, undefined, undefined, this.pageSize, this.page-1, false, "TP").then(
          (data) => {
            this.dataCiteDraftQuery = data.data
          }
        )
      }
    }
  }

  pageChange(event: number) {
    this.page = event
    this.changed(this.activeID, this.searchForm.value.searchTerm)
  }
}

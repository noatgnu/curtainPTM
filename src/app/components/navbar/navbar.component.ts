import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {WebService} from "../../web.service";
import {DataService} from "../../data.service";
import {ScrollService} from "../../scroll.service";
import {SettingsService} from "../../settings.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {SampleAnnotationComponent} from "../sample-annotation/sample-annotation.component";
import {SampleOrderAndHideComponent} from "../sample-order-and-hide/sample-order-and-hide.component";
import {DataFrame, IDataFrame} from "data-forge";
import {AccountsService} from "../../accounts/accounts.service";
import {LoginModalComponent} from "../../accounts/login-modal/login-modal.component";
import {SessionSettingsComponent} from "../session-settings/session-settings.component";
import {AccountsComponent} from "../../accounts/accounts/accounts.component";
import {ToastService} from "../../toast.service";
import {DefaultColorPaletteComponent} from "../default-color-palette/default-color-palette.component";
import {DataSelectionManagementComponent} from "../data-selection-management/data-selection-management.component";
import {QrcodeModalComponent} from "../qrcode-modal/qrcode-modal.component";
import {UniprotService} from "../../uniprot.service";
import {CollaborateModalComponent} from "../collaborate-modal/collaborate-modal.component";
import {SaveStateService} from "../../save-state.service";
import {LocalSessionStateModalComponent} from "../local-session-state-modal/local-session-state-modal.component";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  @Input() finished: boolean = false
  @Input() uniqueLink: string = ""
  @Output() updateSelection: EventEmitter<boolean> = new EventEmitter<boolean>()
  filterModel: string = ""
  constructor(
    public web: WebService,
    public data: DataService,
    private scroll: ScrollService,
    public settings: SettingsService,
    private modal: NgbModal,
    public accounts: AccountsService,
    private toast: ToastService,
    private uniprot: UniprotService,
    private saveState: SaveStateService
  ) { }

  ngOnInit(): void {
  }

  saveSession() {
    if (!this.accounts.curtainAPI.user.loginStatus) {
      if (this.web.siteProperties.non_user_post) {
        this.saving();
      } else {
        this.toast.show("User information", "Please login before saving data session").then()
      }
    } else {
      if (!this.accounts.curtainAPI.user.curtainLinkLimitExceeded ) {
        this.saving();
      } else {
        this.toast.show("User information", "Curtain link limit exceed").then()
      }
    }

  }

  private saving() {
    const data: any = {
      raw: this.data.raw.originalFile,
      rawForm: this.data.rawForm,
      differentialForm: this.data.differentialForm,
      processed: this.data.differential.originalFile,
      settings: this.settings.settings,
      password: "",
      selections: this.data.selected,
      selectionsMap: this.data.selectedMap,
      selectionsName: this.data.selectOperationNames,
      dbIDMap: this.data.dbIDMap,
      fetchUniProt: this.data.fetchUniProt,
      annotatedData: this.data.annotatedData,
      annotatedMap: this.data.annotatedMap
    }
    this.accounts.curtainAPI.putSettings(data, !this.accounts.curtainAPI.user.loginStatus, data.settings.description, "PTM", this.onUploadProgress).then((data: any) => {
      if (data.data) {
        this.settings.settings.currentID = data.data.link_id
        this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
        this.uniprot.uniprotProgressBar.next({value: 100, text: "Session data saved"})
        this.finished = true
      }
    }, err => {
      this.toast.show("User information", "Curtain link cannot be saved").then()
    })
  }
  onUploadProgress = (progressEvent: any) => {
    this.uniprot.uniprotProgressBar.next({value: progressEvent.progress * 100, text: "Uploading session data at " + Math.round(progressEvent.progress *100) + "%"})
  }
  clearSelections() {
    this.data.clear()
    this.data.dataClear.next(true)
  }

  scrollTo() {
    let res: string[] = []
    switch (this.data.searchType) {
      case "Gene Names":
        res = this.data.getPrimaryFromGeneNames(this.filterModel)
        break
      case "Accession IDs":
        res = this.data.getPrimaryFromAcc(this.filterModel)
        break
      case "Primary IDs":
        res = [this.filterModel]
        break
    }
    if (res.length > 0) {
      const primaryIDs = res[0]
      const ind = this.data.selected.indexOf(primaryIDs)
      const newPage = ind + 1
      if (this.data.page !== newPage) {
        this.data.page = ind + 1
      }
      this.scroll.scrollToID(primaryIDs+"scrollID")
    }
  }

  openAnnotation() {
    const ref = this.modal.open(SampleAnnotationComponent, {size: "lg"})
    ref.closed.subscribe(data => {
      for (const i in data) {
        // @ts-ignore
        this.settings.settings.project[i] = data[i]
      }
    })
  }
  openSampleSettings() {
    const ref = this.modal.open(SampleOrderAndHideComponent)
  }

  openLoginModal() {
    const ref = this.modal.open(LoginModalComponent)
    return ref
  }

  openSessionSettings() {
    const ref = this.modal.open(SessionSettingsComponent)
    ref.componentInstance.currentID = this.settings.settings.currentID
  }

  openAccountModal() {
    const ref = this.modal.open(AccountsComponent)
  }
  openColorPaletteModal() {
    const ref = this.modal.open(DefaultColorPaletteComponent, {size: "xl", scrollable: true})

  }

  selectionManagementModal() {
    const ref = this.modal.open(DataSelectionManagementComponent, {scrollable: true})
    ref.closed.subscribe(data => {
      if (data) {
        this.data.selectedAccessions = []
        this.data.selectedGenes = []
        if (this.data.selected.length > 0) {
          this.updateSelection.next(true)
        } else {
          this.clearSelections()
        }

      }
    })
  }

  openQRCode() {
    const ref = this.modal.open(QrcodeModalComponent, {size: "sm"})
    if (this.settings.settings.currentID) {
      ref.componentInstance.url = location.origin + "/#/" + this.settings.settings.currentID
    }
  }

  copyToClipboard(text: string = "") {
    if (text === "") {
      text = location.origin + "/#/" + this.settings.settings.currentID
    }
    navigator.clipboard.writeText(text).then(() => {
      this.toast.show("Clipboard", "Session link has been copied to clipboard").then()
    })
  }

  openCollaborateModal() {
    const ref = this.modal.open(CollaborateModalComponent)
  }

  saveLocalState() {
    this.saveState.saveState()
    this.toast.show("Local state", "A local settings state has been created").then()
  }

  openStateModal() {
    const ref = this.modal.open(LocalSessionStateModalComponent, {scrollable: true})
  }
}

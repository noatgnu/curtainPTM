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
import {ProfilePlotComponent} from "../profile-plot/profile-plot.component";
import {Subscription} from "rxjs";
import {
  SampleConditionAssignmentModalComponent
} from "../sample-condition-assignment-modal/sample-condition-assignment-modal.component";
import {UserPtmImportManagementComponent} from "../user-ptm-import-management/user-ptm-import-management.component";
import {EncryptionSettingsComponent} from "../encryption-settings/encryption-settings.component";
import {CurtainEncryption, saveToLocalStorage} from "curtain-web-api";
import {PrimaryIdExportModalComponent} from "../primary-id-export-modal/primary-id-export-modal.component";
import {LogFileModalComponent} from "../log-file-modal/log-file-modal.component";
import {DataCiteCurtain} from "../../data-cite-metadata";
import {DataciteAdminManagementComponent} from "../datacite-admin-management/datacite-admin-management.component";
import {DataciteComponent} from "../datacite/datacite.component";

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    standalone: false
})
export class NavbarComponent implements OnInit {
  @Input() loadingDataCite: boolean = false
  @Input() doiMetadata: any = {}
  @Input() isDOI: boolean = false
  @Input() finished: boolean = false
  @Input() uniqueLink: string = ""
  @Output() updateSelection: EventEmitter<boolean> = new EventEmitter<boolean>()
  filterModel: string = ""
  progressEvent: any = {}
  subscription: Subscription = new Subscription();
  @Input() permanent: boolean = false
  showAlert: boolean = true;
  _gdprAccepted: boolean = false

  get gdprAccepted(): boolean {
    return this._gdprAccepted
  }

  set gdprAccepted(value: boolean) {
    this._gdprAccepted = value
    localStorage.setItem("CurtainGDPR", value.toString())
  }

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
  ) {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this.subscription = this.uniprot.uniprotProgressBar.asObservable().subscribe((data: any) => {
      this.progressEvent = data
    })

    if (localStorage.getItem("CurtainGDPR") === "true") {
      this.GDPR = true
      this.gdprAccepted = true
    } else {
      this.GDPR = false
      this.gdprAccepted = false
    }
  }

  ngOnInit(): void {
  }

  saveSession(permanent: boolean = false) {
    this.toast.show("User information", "Saving session data").then()
    if (!this.accounts.curtainAPI.user.loginStatus) {
      if (this.web.siteProperties.non_user_post) {
        this.saving(permanent);
      } else {
        this.toast.show("User information", "Please login before saving data session").then()
      }
    } else {
      if (!this.accounts.curtainAPI.user.curtainLinkLimitExceeded ) {
        this.saving(permanent);
      } else {
        this.toast.show("User information", "Curtain link limit exceed").then()
      }
    }

  }

  private saving(permanent: boolean) {
    const extraData: any = {
      uniprot: {
        results: this.uniprot.results,
        dataMap: this.uniprot.dataMap,
        db: this.uniprot.db,
        organism: this.uniprot.organism,
        accMap: this.uniprot.accMap,
        geneNameToPrimary: this.uniprot.geneNameToPrimary,
      },
      data: {
        accessionToPrimaryIDs: this.data.accessionToPrimaryIDs,
        primaryIDsList: this.data.primaryIDsList,
        accessionList: this.data.accessionList,
        accessionMap: this.data.accessionMap,
        genesMap: this.data.genesMap,
        allGenes: this.data.allGenes,
        dataMap: this.data.dataMap,
      }
    }
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
      annotatedMap: this.data.annotatedMap,
      extraData: extraData,
      permanent: permanent
    }

    const encryption: CurtainEncryption = {
      encrypted: this.settings.settings.encrypted,
      e2e: this.settings.settings.encrypted,
      publicKey: this.data.public_key,
    }
    this.toast.show("User information", "Uploading session data", undefined, undefined, "upload").then()
    this.accounts.curtainAPI.putSettings(data, !this.accounts.curtainAPI.user.loginStatus, data.settings.description, "PTM", encryption, permanent, this.onUploadProgress).then((data: any) => {
      if (data.data) {
        this.toast.show("User information", `Curtain link has been saved with unique id ${data.data.link_id}`).then()
        this.settings.settings.currentID = data.data.link_id
        this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
        this.uniprot.uniprotProgressBar.next({value: 100, text: "Session data saved"})
        this.permanent = data.data.permanent
        this.data.session = data.data
        this.finished = true
      }
    }, err => {
      this.toast.show("User information", "Curtain link cannot be saved").then()
    })
  }
  onUploadProgress = (progressEvent: any) => {
    this.uniprot.uniprotProgressBar.next({value: progressEvent.progress * 100, text: "Uploading session data at " + Math.round(progressEvent.progress *100) + "%"})
    this.data.uploadProgress.next(progressEvent.progress * 100)
  }
  clearSelections() {
    //this.data.clear()
    this.data.selected = []
    this.data.selectedGenes = []
    this.data.selectedMap = {}
    this.data.selectOperationNames = []
    this.data.selectedAccessions = []
    this.settings.settings.textAnnotation = {}
    this.data.annotatedData = {}
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
    const ref = this.modal.open(AccountsComponent, {size: "xl", scrollable: true})
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

  getSelectedList() {
    //this.web.downloadFile("SelectedPrimaryIDs.txt", this.data.selected.join("\n"))
    const ref = this.modal.open(PrimaryIdExportModalComponent, {scrollable: true})
  }

  openProfilePlot() {
    const ref = this.modal.open(ProfilePlotComponent, {size: "xl", scrollable: true})
    ref.componentInstance.selected = this.settings.settings.selectedComparison.slice()
    ref.componentInstance.data = this.data.raw.df
  }

  openSampleAndConditionModal() {
    const ref = this.modal.open(SampleConditionAssignmentModalComponent, {scrollable: true})
  }

  reload() {
    window.location.reload()
  }

  openUserPTMImportManagement() {
    const ref = this.modal.open(UserPtmImportManagementComponent, {scrollable: true})

  }
  openEncryptionSettings() {

    const ref = this.modal.open(EncryptionSettingsComponent, {scrollable: true})
    ref.componentInstance.enabled = this.settings.settings.encrypted
    ref.closed.subscribe(data => {
      if (data.savePublicKey && data.public_key) {
        saveToLocalStorage(data.public_key, "public").then()
      }
      if (data.savePrivateKey && data.private_key) {
        saveToLocalStorage(data.private_key, "private").then()
      }
      this.settings.settings.encrypted = data.enabled
      if (data.public_key) {
        this.data.public_key = data.public_key
      }
      if (data.private_key) {
        this.data.private_key = data.private_key
      }

    })
  }

  GDPR: boolean = false

  closeGDPR() {
    this.GDPR = false
    //localStorage.setItem("GDPR", "true")
  }

  openLogFileModal() {
    const ref = this.modal.open(LogFileModalComponent, {scrollable: true, size: "xl"})
  }

  openDataciteDOI() {
    const ref = this.modal.open(DataciteComponent, {scrollable: true, size: "xl"})
    ref.componentInstance.linkID = this.settings.settings.currentID
    if (this.data.session) {
      if (this.data.session.data_cite) {
        ref.componentInstance.dataCiteMetadata = this.data.session.data_cite
        ref.componentInstance.lock = this.data.session.data_cite.lock
      }
    }

    ref.closed.subscribe((data: DataCiteCurtain) => {
      if (data) {
        //this.uniqueLink = location.origin + "/#/" + encodeURIComponent(`doi.org/${data.doi}`)
        //this.settings.settings.currentID = `doi.org/${data.doi}`
        //this.permanent = true
        //this.isDOI = true
        if (this.data.session) {
          //this.data.session.permanent = true
          this.data.session.data_cite = data
        }
      }
    })
  }

  openDataciteAdminManagement() {
    const ref = this.modal.open(DataciteAdminManagementComponent, {scrollable: true, size: "xl", backdrop: "static"})

  }
}

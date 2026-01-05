import {Component, EventEmitter, Input, OnInit, Output, signal, effect} from '@angular/core';
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
import {CurtainEncryption, saveToLocalStorage, replacer, Announcement} from "curtain-web-api";
import {PrimaryIdExportModalComponent} from "../primary-id-export-modal/primary-id-export-modal.component";
import {AreYouSureClearModalComponent} from "../are-you-sure-clear-modal/are-you-sure-clear-modal.component";
import {LogFileModalComponent} from "../log-file-modal/log-file-modal.component";
import {DataCiteCurtain} from "../../data-cite-metadata";
import {DataciteAdminManagementComponent} from "../datacite-admin-management/datacite-admin-management.component";
import {DataciteComponent} from "../datacite/datacite.component";
import {PermanentLinkRequestModalComponent} from "../permanent-link-request-modal/permanent-link-request-modal.component";
import {
  CollectionManagementModalComponent
} from "../collection-management-modal/collection-management-modal.component";
import {
  CollectionSessionsViewerModalComponent
} from "../collection-sessions-viewer-modal/collection-sessions-viewer-modal.component";
import {ThemeService} from "../../theme.service";

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
  showAlert = signal(true);
  gdprAccepted = signal(false);
  currentAnnouncement = signal<Announcement | null>(null);
  dismissedAnnouncementIds: Set<number> = this.loadDismissedAnnouncements()
  GDPR = signal(false);
  hasSavedClearSettings = signal(localStorage.getItem('curtainClearSettingsSelection') !== null);

  sessionCollections: any[] = []
  selectedCollectionId: number | null = null
  loadingCollections: boolean = false
  sessionLinkDismissed = signal(false)

  constructor(
    public web: WebService,
    public data: DataService,
    private scroll: ScrollService,
    public settings: SettingsService,
    private modal: NgbModal,
    public accounts: AccountsService,
    private toast: ToastService,
    private uniprot: UniprotService,
    private saveState: SaveStateService,
    public themeService: ThemeService
  ) {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this.subscription = this.uniprot.uniprotProgressBar.asObservable().subscribe((data: any) => {
      this.progressEvent = data
    })

    if (localStorage.getItem("CurtainGDPR") === "true") {
      this.GDPR.set(true)
      this.gdprAccepted.set(true)
    } else {
      this.GDPR.set(false)
      this.gdprAccepted.set(false)
    }
    this.data.dataClear.asObservable().subscribe((data: any) => {
      this.hasSavedClearSettings.set(localStorage.getItem('curtainClearSettingsSelection') !== null)
    })
    effect(() => {
      localStorage.setItem("CurtainGDPR", this.gdprAccepted().toString())
    })
  }

  ngOnInit(): void {
    this.loadAnnouncements()
    if (this.data.session && this.data.session.link_id) {
      this.loadSessionCollections(this.data.session.link_id)
    }
  }

  ngOnChanges(): void {
    if (this.data.session && this.data.session.link_id) {
      this.loadSessionCollections(this.data.session.link_id)
    }
  }

  loadAnnouncements() {
    this.accounts.curtainAPI.getAnnouncements(1, 0).then((response) => {
      if (response.data && response.data.results.length > 0) {
        const announcements = response.data.results.filter(
          a => a.is_active && !this.dismissedAnnouncementIds.has(a.id)
        )
        if (announcements.length > 0) {
          this.currentAnnouncement.set(announcements[0])
        }
      }
    }).catch(err => {
      console.error('Failed to load announcements:', err)
    })
  }

  dismissAnnouncement(id: number) {
    this.dismissedAnnouncementIds.add(id)
    this.saveDismissedAnnouncements()
    this.currentAnnouncement.set(null)
  }

  loadDismissedAnnouncements(): Set<number> {
    const stored = localStorage.getItem('CurtainDismissedAnnouncements')
    if (stored) {
      try {
        const ids = JSON.parse(stored)
        return new Set(ids)
      } catch (e) {
        return new Set()
      }
    }
    return new Set()
  }

  saveDismissedAnnouncements() {
    const ids = Array.from(this.dismissedAnnouncementIds)
    localStorage.setItem('CurtainDismissedAnnouncements', JSON.stringify(ids))
  }

  getAnnouncementClass(type: string): string {
    switch (type) {
      case 'warning':
        return 'warning'
      case 'error':
        return 'danger'
      case 'success':
        return 'success'
      case 'info':
        return 'info'
      case 'maintenance':
        return 'dark'
      default:
        return 'primary'
    }
  }

  async saveSession() {
    if (!this.accounts.curtainAPI.user.loginStatus) {
      if (!this.web.siteProperties.non_user_post) {
        this.toast.show("User information", "Please login before saving data session").then()
        return;
      }
    } else {
      if (this.accounts.curtainAPI.user.curtainLinkLimitExceeded) {
        this.toast.show("User information", "Curtain link limit exceed").then()
        return;
      }
    }

    const { SessionSaveModalComponent } = await import('../session-save-modal/session-save-modal.component');
    const modalRef = this.modal.open(SessionSaveModalComponent, {
      backdrop: 'static',
      size: 'md'
    });
    modalRef.componentInstance.siteProperties = this.web.siteProperties;
    modalRef.componentInstance.isStaff = this.accounts.curtainAPI.user.isStaff;

    try {
      const result = await modalRef.result;
      this.toast.show("User information", "Saving session data").then()
      this.saving(result.permanent, result.expiryDuration);
    } catch (error) {
      console.log('Modal dismissed');
    }
  }

  private async saving(permanent: boolean, expiryDuration?: number) {
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

    const jsonString = JSON.stringify(data, replacer)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const file = new File([blob], 'curtain-settings.json', { type: 'application/json' })

    const CHUNK_THRESHOLD = 5 * 1024 * 1024

    if (file.size > CHUNK_THRESHOLD) {
      try {
        const response = await this.accounts.curtainAPI.uploadCurtainFileInChunks(
          file,
          1024 * 1024,
          {
            description: data.settings.description,
            curtain_type: "PTM",
            permanent: permanent,
            encrypted: encryption.encrypted,
            expiry_duration: expiryDuration,
            enable: !this.accounts.curtainAPI.user.loginStatus,
            onProgress: (progress: number) => {
              this.uniprot.uniprotProgressBar.next({
                value: progress,
                text: `Uploading session data at ${Math.round(progress)}%`
              })
              this.data.uploadProgress.next(progress)
            }
          }
        )

        if (response.curtain) {
          this.toast.show("User information", `Curtain link has been saved with unique id ${response.curtain.link_id}`).then()
          this.settings.settings.currentID = response.curtain.link_id
          this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
          this.uniprot.uniprotProgressBar.next({value: 100, text: "Session data saved"})
          this.permanent = response.curtain.permanent
          this.sessionLinkDismissed.set(false)
          this.data.session = response.curtain
          this.finished = true
        }
      } catch (err) {
        console.error('Chunk upload failed, falling back to regular upload:', err)
        this.fallbackToRegularUpload(data, encryption, permanent, expiryDuration)
      }
    } else {
      this.fallbackToRegularUpload(data, encryption, permanent, expiryDuration)
    }
  }

  private fallbackToRegularUpload(data: any, encryption: CurtainEncryption, permanent: boolean, expiryDuration?: number) {
    this.accounts.curtainAPI.putSettings(data, !this.accounts.curtainAPI.user.loginStatus, data.settings.description, "PTM", encryption, permanent, expiryDuration, this.onUploadProgress).then((data: any) => {
      if (data.data) {
        this.toast.show("User information", `Curtain link has been saved with unique id ${data.data.link_id}`).then()
        this.settings.settings.currentID = data.data.link_id
        this.uniqueLink = location.origin + "/#/" + this.settings.settings.currentID
        this.uniprot.uniprotProgressBar.next({value: 100, text: "Session data saved"})
        this.permanent = data.data.permanent
        this.sessionLinkDismissed.set(false)
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
    const rememberClearSettings = localStorage.getItem("curtainRememberClearSettings")
    const savedSettings = localStorage.getItem('curtainClearSettingsSelection')

    if (rememberClearSettings === "true" && savedSettings) {
      let settingsToClear: {[key: string]: boolean} = {}
      if (savedSettings) {
        try {
          settingsToClear = JSON.parse(savedSettings)
        } catch (e) {
          console.error('Failed to parse saved clear settings:', e)
        }
      }
      if (settingsToClear['selections']) {
        this.data.selected = []
        this.data.selectedGenes = []
        this.data.selectedAccessions = []
        this.data.selectedMap = {}
        this.data.selectOperationNames = []
      }
      if (settingsToClear['textAnnotation']) {
        this.settings.settings.textAnnotation = {}
      }
      if (settingsToClear['volcanoShapes']) {
        this.settings.settings.volcanoAdditionalShapes = []
      }
      if (settingsToClear['annotatedData']) {
        this.data.annotatedData = {}
      }
      this.data.dataClear.next(true)
    } else {
      const ref = this.modal.open(AreYouSureClearModalComponent)
      ref.closed.subscribe(data => {
        if (data) {
          if (data.selections) {
            this.data.selected = []
            this.data.selectedGenes = []
            this.data.selectedAccessions = []
            this.data.selectedMap = {}
            this.data.selectOperationNames = []
          }
          if (data.textAnnotation) {
            this.settings.settings.textAnnotation = {}
          }
          if (data.volcanoShapes) {
            this.settings.settings.volcanoAdditionalShapes = []
          }
          if (data.annotatedData) {
            this.data.annotatedData = {}
          }
          this.data.dataClear.next(true)
        }
      })
    }
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

  closeGDPR() {
    this.GDPR.set(true)
    this.showAlert.set(false)
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

  openPermanentLinkRequestModal() {
    const ref = this.modal.open(PermanentLinkRequestModalComponent, {scrollable: true, size: "lg"})
    if (this.data.session) {
      ref.componentInstance.curtainId = this.data.session.id
    }
  }

  openCollectionManagementModal() {
    if (this.data.session && this.data.session.link_id) {
      const ref = this.modal.open(CollectionManagementModalComponent, {size: "lg", scrollable: true})
      ref.componentInstance.linkId = this.data.session.link_id
    }
  }

  async loadSessionCollections(linkId: string): Promise<void> {
    if (!linkId) return

    try {
      this.loadingCollections = true
      const response = await this.accounts.getCollections(1, 100, '', false, linkId)
      this.sessionCollections = response.results || []

      if (this.sessionCollections.length > 0) {
        const savedCollectionId = localStorage.getItem('selectedCollectionId')
        if (savedCollectionId) {
          const found = this.sessionCollections.find(c => c.id === parseInt(savedCollectionId))
          this.selectedCollectionId = found ? found.id : this.sessionCollections[0].id
        } else {
          this.selectedCollectionId = this.sessionCollections[0].id
        }
        localStorage.setItem('selectedCollectionId', this.selectedCollectionId!.toString())
      } else {
        this.selectedCollectionId = null
        localStorage.removeItem('selectedCollectionId')
      }
    } catch (error) {
      console.error('Failed to load session collections:', error)
      this.sessionCollections = []
      this.selectedCollectionId = null
    } finally {
      this.loadingCollections = false
    }
  }

  selectCollection(collectionId: number): void {
    this.selectedCollectionId = collectionId
    localStorage.setItem('selectedCollectionId', collectionId.toString())
  }

  get selectedCollection(): any {
    return this.sessionCollections.find(c => c.id === this.selectedCollectionId)
  }

  openCollectionSessionsModal(): void {
    if (this.selectedCollectionId) {
      const ref = this.modal.open(CollectionSessionsViewerModalComponent, {size: "lg", scrollable: true})
      ref.componentInstance.collectionId = this.selectedCollectionId
    }
  }

  get availableThemes() {
    return this.themeService.getAvailableThemes()
  }

  get currentThemeName() {
    return this.themeService.getCurrentThemeName()
  }

  selectTheme(themeName: string): void {
    this.themeService.setName(themeName as any)
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    this.themeService.setMode(mode)
  }

  dismissSessionLink(): void {
    this.sessionLinkDismissed.set(true)
  }

  removeClearSettings() {
    localStorage.removeItem('curtainClearSettingsSelection')
  }
}

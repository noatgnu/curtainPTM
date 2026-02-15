import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {InputFile} from "../../../classes/input-file";
import {Raw} from "../../../classes/raw";
import {Differential} from "../../../classes/differential";
import {Settings} from "../../../classes/settings";
import {FormBuilder, FormGroup} from "@angular/forms";
import {DataFrame, fromCSV, fromJSON, IDataFrame, Series} from "data-forge";
import {UniprotService} from "../../../uniprot.service";
import {DataService} from "../../../data.service";
import {SettingsService} from "../../../settings.service";
import {BatchUploadService} from "../batch-upload.service";
import {CurtainEncryption, replacer} from "curtain-web-api";
import {AccountsService} from "../../../accounts/accounts.service";
import {ToastService} from "../../../toast.service";

@Component({
  selector: 'app-individual-session',
  standalone: false,
  templateUrl: './individual-session.component.html',
  styleUrl: './individual-session.component.scss',
  providers: [
    UniprotService,
    DataService,
    SettingsService
  ]
})
export class IndividualSessionComponent implements OnChanges, AfterViewInit {
  @Input() sessionId: number = -1;
  private _session: {data: {
      raw: InputFile,
      rawForm: Raw,
      differentialForm: Differential,
      processed: InputFile,
      password: string,
      selections: [],
      selectionsMap: any,
      selectionsName: [],
      settings: Settings,
      fetchUniProt: boolean,
      annotatedData: any,
      extraData: any,
      permanent: boolean,
      uniqueComparisons: string[]
    },
    form: FormGroup,
    rawColumns: string[],
    differentialColumns: string[],
    rawFile: null|File,
    differentialFile: null|File,
    uniqueComparisons: string[],
    linkId: string|undefined|null,
    colorCategoryForms: FormGroup[],
    colorCategoryColumn: string,
    colorCategoryPrimaryIdColumn: string,
    private: boolean,
    volcanoColors: any,
    colorPalette: string,
  }|undefined = undefined;

  colorPalletes: string[] = []
  autoMatchSampleColumnsPattern = "\.s"

  @Input() set session(value: {data: {
      raw: InputFile,
      rawForm: Raw,
      differentialForm: Differential,
      processed: InputFile,
      password: string,
      selections: [],
      selectionsMap: any,
      selectionsName: [],
      settings: Settings,
      fetchUniProt: boolean,
      annotatedData: any,
      extraData: any,
      permanent: boolean,
      uniqueComparisons: string[]
    },
    form: FormGroup,
    rawColumns: string[],
    differentialColumns: string[],
    rawFile: null|File,
    differentialFile: null|File,
    uniqueComparisons: string[],
    linkId: string|undefined|null,
    colorCategoryForms: FormGroup[],
    colorCategoryColumn: string,
    colorCategoryPrimaryIdColumn: string,
    private: boolean,
    volcanoColors: any,
    colorPalette: string,
  }|undefined) {
    this._session = value
    this.defaultVolcanoColors()
  }

  get session() {
    return this._session
  }

  @Input() differentialFiles: File[] = [];
  @Input() rawFiles: File[] = [];
  @Output() changed: EventEmitter<any> = new EventEmitter<any>();
  @Output() finished: EventEmitter<string> = new EventEmitter<string>();

  progressBar: any = {value: 0, text: ""}
  payload: any = {}
  isVolcanoPlotSettingsClosed = true
  isColorPaletteClosed = true

  availableCollections: any[] = []
  selectedCollectionIds: number[] = []
  newCollectionName: string = ''
  newCollectionDescription: string = ''
  loadingCollections: boolean = false
  isCreatingCollection: boolean = false

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    public accounts: AccountsService,
    private batchService: BatchUploadService,
    private data: DataService,
    private uniprot: UniprotService,
    private cd: ChangeDetectorRef,
    public settings: SettingsService
  ) {
    this.batchService.taskStartAnnouncer.subscribe((taskId: number) => {
      if (taskId === this.sessionId) {
        this.startWork().then()
      }
    })
    this.batchService.resetAnnouncer.subscribe((taskId: number) => {
      if (taskId === this.sessionId) {
        this.reset()
      }
    })
    this.colorPalletes = Object.keys(this.data.palette)
  }

  ngAfterViewInit() {
    this.loadCollections()
  }

  async loadCollections() {
    if (!this.accounts.curtainAPI.user.loginStatus) {
      return
    }
    try {
      this.loadingCollections = true
      const response = await this.accounts.getCollections(1, 10, '', true)
      this.availableCollections = response.results || []
    } catch (error) {
      this.availableCollections = []
    } finally {
      this.loadingCollections = false
    }
  }

  async createNewCollection() {
    if (!this.newCollectionName.trim()) {
      this.toast.show("Error", "Collection name is required").then()
      return
    }
    try {
      this.isCreatingCollection = true
      const newCollection = await this.accounts.createCollection(this.newCollectionName, this.newCollectionDescription)
      if (newCollection && newCollection.id) {
        this.availableCollections.push(newCollection)
        this.selectedCollectionIds.push(newCollection.id)
        this.newCollectionName = ''
        this.newCollectionDescription = ''
      }
    } catch (error) {
    } finally {
      this.isCreatingCollection = false
    }
  }

  toggleCollectionSelection(collectionId: number) {
    const index = this.selectedCollectionIds.indexOf(collectionId)
    if (index > -1) {
      this.selectedCollectionIds.splice(index, 1)
    } else {
      this.selectedCollectionIds.push(collectionId)
    }
  }

  async addSessionToCollections(linkId: string) {
    if (this.selectedCollectionIds.length === 0) {
      return
    }
    for (const collectionId of this.selectedCollectionIds) {
      try {
        await this.accounts.addCurtainToCollection(collectionId, linkId)
      } catch (error) {
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.changed.emit(this.session)
  }

  getComparisonColumnUnique(session: any, columnComp: string) {
    if (session.differentialFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const loadedFile = e.target.result;
          const df = fromCSV(<string>loadedFile)
          const column = df.getSeries(columnComp)
          session.uniqueComparisons = column.distinct().toArray()
          session.data.differentialForm.comparisonSelect = session.uniqueComparisons[0]
        } else {
          session.uniqueComparisons = []
        }
      }
      reader.readAsText(session.differentialFile)
    }
  }

  async readRawFile() {
    if (this.session && this.session.rawFile) {
      const file = await this.readFileAsync(this.session.rawFile)
      const df = fromCSV(file)
      this.data.raw.df = df
      this.data.raw.originalFile = file
    }
  }

  async readDifferentialFile() {
    if (this.session && this.session.differentialFile) {
      const file = await this.readFileAsync(this.session.differentialFile)
      const df = fromCSV(file)
      this.data.differential.df = df
      this.data.differential.originalFile = file
    }
  }

  async startWork() {
    if (!this.session) {
      return
    }

    this.data.fetchUniProt = this.session.data.fetchUniProt
    await this.readDifferentialFile()
    await this.readRawFile()

    for (const d in this.session.data.differentialForm) {
      if (this.session.data.differentialForm.hasOwnProperty(d)) {
        // @ts-ignore
        this.data.differentialForm[d] = this.session.data.differentialForm[d]
      }
    }
    this.data.rawForm = this.session.data.rawForm

    if (typeof Worker !== 'undefined') {
      const worker = new Worker(new URL('../../file-form/data.worker', import.meta.url));
      worker.onmessage = (data: MessageEvent<any>) => {
        if (data.data) {
          if (data.data.type === "progress") {
            this.updateProgressBar(data.data.value, data.data.text)
          } else {
            if (data.data.type === "resultDifferential") {
              this.data.differential.df = fromJSON(data.data.differential)
              for (const i in this.data.differentialForm) {
                if (this.data.differentialForm.hasOwnProperty(i)) {
                  if (i in data.data.differentialForm) {
                    // @ts-ignore
                    this.data.differentialForm[i] = data.data.differentialForm[i]
                  }
                }
              }

              const currentDF = this.data.differential.df.where(r => r[this.data.differentialForm.comparison] === this.data.differentialForm.comparisonSelect).resetIndex().bake()

              const fc = currentDF.getSeries(this.data.differentialForm.foldChange).where(i => !isNaN(i)).bake()
              const sign = currentDF.getSeries(this.data.differentialForm.significant).where(i => !isNaN(i)).bake()

              this.data.minMax = {
                fcMin: fc.min(),
                fcMax: fc.max(),
                pMin: sign.min(),
                pMax: sign.max()
              }
              this.data.currentDF = currentDF
              this.data.primaryIDsList = this.data.currentDF.getSeries(this.data.differentialForm.primaryIDs).bake().distinct().toArray()
              this.data.accessionList = this.data.currentDF.getSeries(this.data.differentialForm.accession).bake().distinct().toArray()
              for (const p of this.data.accessionList) {
                if (!this.data.accessionMap[p]) {
                  this.data.accessionMap[p] = {}
                  this.data.accessionMap[p][p] = true
                }
                for (const n of p.split(";")) {
                  if (!this.data.accessionMap[n]) {
                    this.data.accessionMap[n] = {}
                  }
                  this.data.accessionMap[n][p] = true
                }
              }

              worker.postMessage({
                task: 'processRawFile',
                rawForm: this.data.rawForm,
                raw: this.data.raw.originalFile,
                settings: Object.assign({}, this.settings.settings)
              })
              this.data.raw.df = new DataFrame()
            } else if (data.data.type === "resultRaw") {
              this.data.raw.df = fromJSON(data.data.raw)
              for (const s in this.settings.settings) {
                if (this.settings.settings.hasOwnProperty(s)) {
                  // @ts-ignore
                  this.settings.settings[s] = data.data.settings[s]
                }
              }
              this.data.conditions = data.data.conditions

              this.copySessionSettings()
              this.addDefaultColors()
              this.processUniProt()
              worker.terminate()
            }
          }
        } else {
          worker.terminate()
        }
      };

      worker.postMessage({
        task: 'processDifferentialFile',
        differential: this.data.differential.originalFile,
        differentialForm: this.data.differentialForm
      });
      this.data.differential.df = new DataFrame()
    } else {
      await this.processFiles()
    }
  }

  private addDefaultColors() {
    if (this.session) {
      for (const c in this.session.volcanoColors) {
        const colorName = `${this.session.volcanoColors[c].p}${this.settings.settings.pCutoff};${this.session.volcanoColors[c].fc}${this.settings.settings.log2FCCutoff}`
        this.settings.settings.colorMap[colorName] = this.session.volcanoColors[c].color
      }
    }
  }

  processUniProt() {
    if (!this.session) {
      return
    }
    if (this.data.fetchUniProt) {
      if (!this.data.bypassUniProt) {
        this.uniprot.geneNameToPrimary = {}
        const accList: string[] = []
        this.data.dataMap = new Map<string, string>()
        this.data.genesMap = {}
        this.uniprot.accMap = new Map<string, string>()
        this.uniprot.dataMap = new Map<string, string>()
        for (const r of this.data.currentDF) {
          const a = r[this.data.differentialForm.accession]
          this.data.dataMap.set(a, r[this.data.differentialForm.accession])
          this.data.dataMap.set(r[this.data.differentialForm.primaryIDs], a)
          this.data.dataMap.set(r[this.data.differentialForm.accession], a)

          const d = a.split(";")
          const accession = this.uniprot.Re.exec(d[0])
          if (accession) {
            this.uniprot.accMap.set(a, accession[1])
            if (!this.data.accessionToPrimaryIDs[accession[1]]) {
              this.data.accessionToPrimaryIDs[accession[1]] = {}
            }
            this.data.accessionToPrimaryIDs[accession[1]][r[this.data.differentialForm.primaryIDs]] = true
            this.uniprot.accMap.set(r[this.data.differentialForm.primaryIDs], accession[1])

            if (!this.uniprot.dataMap.has(accession[1])) {
              if (!accList.includes(accession[1])) {
                accList.push(accession[1])
              }
            }
          }
        }
        if (accList.length > 0) {
          this.uniprot.UniprotParserJS(accList).then(r => {
            this.createUniprotDatabase().then((allGenes)=> {
              this.data.allGenes = allGenes
              this.updateProgressBar(100, "Finished")
              this.payload = this.createPayload(this.session!.data.permanent)
              this.saveSession()
            });
          })
        } else {
          this.updateProgressBar(100, "Finished")
          this.payload = this.createPayload(this.session.data.permanent)
          this.saveSession()
        }
      } else {
        this.data.bypassUniProt = false
        this.updateProgressBar(100, "Finished")
        this.payload = this.createPayload(this.session.data.permanent)
        this.saveSession()
      }
    } else {
      this.uniprot.geneNameToPrimary = {}
      if (this.data.differentialForm.geneNames !== "") {
        for (const r of this.data.differential.df) {
          if (r[this.data.differentialForm.geneNames] !== "") {
            const g = r[this.data.differentialForm.geneNames]
            if (!this.data.genesMap[g]) {
              this.data.genesMap[g] = {}
              this.data.genesMap[g][g] = true
            }
            for (const n of g.split(";")) {
              if (!this.data.genesMap[n]) {
                this.data.genesMap[n] = {}
              }
              this.data.genesMap[n][g] = true
            }
            if (!this.data.allGenes.includes(g)) {
              this.data.allGenes.push(g)
            }
            if (!this.uniprot.geneNameToPrimary[g]) {
              this.uniprot.geneNameToPrimary[g] = {}
            }
            this.uniprot.geneNameToPrimary[g][r[this.data.differentialForm.primaryIDs]] = true
          }
        }
        this.data.allGenes = this.data.differential.df.getSeries(this.data.differentialForm.geneNames).bake().toArray().filter(v => v !== "")
      }
      this.updateProgressBar(100, "Finished")
      this.payload = this.createPayload(this.session.data.permanent)
      this.saveSession()
    }
  }

  private async createUniprotDatabase() {
    const allGenes: string[] = []
    for (const p of this.data.accessionList) {
      const uni: any = this.uniprot.getUniprotFromAcc(p)
      if (uni) {
        if (uni["Gene Names"]) {
          if (uni["Gene Names"] !== "") {
            if (!allGenes.includes(uni["Gene Names"])) {
              allGenes.push(uni["Gene Names"])
              if (!this.data.genesMap[uni["Gene Names"]]) {
                this.data.genesMap[uni["Gene Names"]] = {}
                this.data.genesMap[uni["Gene Names"]][uni["Gene Names"]] = true
              }
              for (const n of uni["Gene Names"].split(";")) {
                if (!this.data.genesMap[n]) {
                  this.data.genesMap[n] = {}
                }
                this.data.genesMap[n][uni["Gene Names"]] = true
              }
              if (!this.uniprot.geneNameToPrimary[uni["Gene Names"]]) {
                this.uniprot.geneNameToPrimary[uni["Gene Names"]] = {}
              }
              if (this.data.accessionToPrimaryIDs[uni["Entry"]]) {
                for (const e in this.data.accessionToPrimaryIDs[uni["Entry"]]) {
                  this.uniprot.geneNameToPrimary[uni["Gene Names"]][e] = true
                }
              }
            }
          }
        }
      }
    }
    return allGenes
  }

  async processFiles() {
    if (!this.session) {
      return
    }

    if (!this.data.differentialForm.comparison || this.data.differentialForm.comparison === "" || this.data.differentialForm.comparison === "CurtainSetComparison") {
      this.data.differentialForm.comparison = "CurtainSetComparison"
      this.data.differentialForm.comparisonSelect = "1"
      this.data.differential.df = this.data.differential.df.withSeries("CurtainSetComparison", new Series(Array(this.data.differential.df.count()).fill("1"))).bake()
    }

    if (this.data.differentialForm.comparisonSelect === "" || this.data.differentialForm.comparisonSelect === undefined) {
      this.data.differentialForm.comparisonSelect = this.data.differential.df.first()[this.data.differentialForm.comparison]
    }

    const totalSampleNumber = this.data.rawForm.samples.length
    let sampleNumber = 0
    const conditions: string[] = []
    let colorPosition = 0
    const colorMap: any = {}
    const conditionOrder = this.settings.settings.conditionOrder.slice()
    let samples: string[] = []
    if (conditionOrder.length > 0) {
      for (const c of conditionOrder) {
        for (const s of this.settings.settings.sampleOrder[c]) {
          samples.push(s)
        }
      }
    } else {
      samples = this.data.rawForm.samples.slice()
    }

    for (const s of samples) {
      const condition_replicate = s.split(".")
      const replicate = condition_replicate[condition_replicate.length-1]
      const condition = condition_replicate.slice(0, condition_replicate.length-1).join(".")
      if (!conditions.includes(condition)) {
        conditions.push(condition)
        if (colorPosition >= this.settings.settings.defaultColorList.length) {
          colorPosition = 0
        }
        colorMap[condition] = this.settings.settings.defaultColorList[colorPosition]
        colorPosition ++
      }
      if (!this.settings.settings.sampleOrder[condition]) {
        this.settings.settings.sampleOrder[condition] = []
      }
      if (!this.settings.settings.sampleOrder[condition].includes(s)) {
        this.settings.settings.sampleOrder[condition].push(s)
      }

      if (!(s in this.settings.settings.sampleVisible)) {
        this.settings.settings.sampleVisible[s] = true
      }
      this.settings.settings.sampleMap[s] = {replicate: replicate, condition: condition, name: s}
      this.data.raw.df = this.data.raw.df.withSeries(s, new Series(this.convertToNumber(this.data.raw.df.getSeries(s).toArray()))).bake()
      sampleNumber ++
      this.updateProgressBar(sampleNumber*100/totalSampleNumber, "Processed "+s+" sample data")
    }

    if (this.settings.settings.conditionOrder.length === 0) {
      this.settings.settings.conditionOrder = conditions
    }
    this.settings.settings.colorMap = colorMap

    const currentDF = this.data.differential.df.where(r => r[this.data.differentialForm.comparison] === this.data.differentialForm.comparisonSelect).resetIndex().bake()

    const fc = currentDF.getSeries(this.data.differentialForm.foldChange).where(i => !isNaN(i)).bake()
    const sign = currentDF.getSeries(this.data.differentialForm.significant).where(i => !isNaN(i)).bake()

    this.data.minMax = {
      fcMin: fc.min(),
      fcMax: fc.max(),
      pMin: sign.min(),
      pMax: sign.max()
    }
    this.data.currentDF = currentDF
    this.data.conditions = conditions
    this.data.currentDF = this.data.currentDF.withSeries(this.data.differentialForm.foldChange, new Series(this.convertToNumber(this.data.currentDF.getSeries(this.data.differentialForm.foldChange).toArray()))).bake()
    this.data.currentDF = this.data.currentDF.withSeries(this.data.differentialForm.significant, new Series(this.convertToNumber(this.data.currentDF.getSeries(this.data.differentialForm.significant).toArray()))).bake()
    this.data.currentDF = this.data.currentDF.withSeries(this.data.differentialForm.score, new Series(this.convertToNumber(this.data.currentDF.getSeries(this.data.differentialForm.score).toArray()))).bake()

    if (this.data.differentialForm.transformFC) {
      this.data.currentDF = this.data.currentDF.withSeries(this.data.differentialForm.foldChange, new Series(this.log2Convert(this.data.currentDF.getSeries(this.data.differentialForm.foldChange).toArray()))).bake()
    }

    this.updateProgressBar(50, "Processed fold change")
    if (this.data.differentialForm.significant) {
      this.data.differential.df = this.data.differential.df.withSeries(this.data.differentialForm.significant, new Series(this.convertToNumber(this.data.differential.df.getSeries(this.data.differentialForm.significant).toArray()))).bake()
    }
    if (this.data.differentialForm.transformSignificant) {
      this.data.currentDF = this.data.currentDF.withSeries(this.data.differentialForm.significant, new Series(this.log10Convert(this.data.currentDF.getSeries(this.data.differentialForm.significant).toArray()))).bake()
    }
    this.updateProgressBar(100, "Processed significant")

    this.data.primaryIDsList = this.data.currentDF.getSeries(this.data.differentialForm.primaryIDs).bake().distinct().toArray()
    this.data.accessionList = this.data.currentDF.getSeries(this.data.differentialForm.accession).bake().distinct().toArray()
    for (const p of this.data.accessionList) {
      if (!this.data.accessionMap[p]) {
        this.data.accessionMap[p] = {}
        this.data.accessionMap[p][p] = true
      }
      for (const n of p.split(";")) {
        if (!this.data.accessionMap[n]) {
          this.data.accessionMap[n] = {}
        }
        this.data.accessionMap[n][p] = true
      }
    }

    this.copySessionSettings()
    this.addDefaultColors()
    this.processUniProt()
  }

  updateProgressBar(value: number, text: string) {
    this.progressBar.value = value
    this.progressBar.text = text
  }

  convertToNumber(arr: string[]) {
    return arr.map(Number)
  }

  log2Convert(arr: number[]) {
    return arr.map(a => this.log2Stuff(a))
  }

  log2Stuff(data: number) {
    if (data > 0) {
      return Math.log2(data)
    } else if (data < 0) {
      return -Math.log2(Math.abs(data))
    } else {
      return 0
    }
  }

  log10Convert(arr: number[]) {
    return arr.map(a => -Math.log10(a))
  }

  private createPayload(permanent: boolean = false) {
    const extraData: any = {
      uniprot: {
        results: this.uniprot.results,
        dataMap: this.uniprot.dataMap,
        db: this.uniprot.db,
        organism: this.uniprot.organism,
        accMap: this.uniprot.accMap,
        geneNameToPrimary: this.uniprot.geneNameToPrimary
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
      password: "",
      selections: this.data.selected,
      selectionsMap: this.data.selectedMap,
      selectionsName: this.data.selectOperationNames,
      settings: this.settings.settings,
      fetchUniProt: this.data.fetchUniProt,
      annotatedData: this.data.annotatedData,
      extraData: extraData,
      permanent: permanent,
    }

    return data
  }

  async saveSession() {
    if (!this.session) {
      return
    }
    const encryption: CurtainEncryption = {
      encrypted: this.settings.settings.encrypted,
      e2e: this.settings.settings.encrypted,
      publicKey: this.data.public_key,
    }
    this.toast.show("User information", `Curtain link #${this.sessionId+1} is being submitted`).then()

    const jsonString = JSON.stringify(this.payload, replacer)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const file = new File([blob], 'curtain-settings.json', { type: 'application/json' })

    const CHUNK_THRESHOLD = 5 * 1024 * 1024

    if (file.size > CHUNK_THRESHOLD) {
      try {
        const response = await this.accounts.curtainAPI.uploadCurtainFileInChunks(
          file,
          1024 * 1024,
          {
            description: this.payload.settings.description,
            curtain_type: "PTM",
            permanent: this.session.data.permanent,
            encrypted: encryption.encrypted,
            enable: !this.session.private,
            onProgress: (progress: number) => {
              this.updateProgressBar(progress, `Uploading session data at ${Math.round(progress)}%`)
            }
          }
        )

        if (response.curtain) {
          await this.addSessionToCollections(response.curtain.link_id)
          this.finished.emit(response.curtain.link_id)
          this.reset()
          this.updateProgressBar(100, "Finished")
          this.toast.show("User information", `Curtain link ${this.sessionId+1} saved with unique id ${response.curtain.link_id}`).then()
        }
      } catch (err) {
        this.fallbackToRegularUpload(encryption)
      }
    } else {
      this.fallbackToRegularUpload(encryption)
    }
  }

  private async fallbackToRegularUpload(encryption: CurtainEncryption) {
    if (!this.session) {
      return
    }
    try {
      const data: any = await this.accounts.curtainAPI.putSettings(this.payload, !this.session.private, this.payload.settings.description, "PTM", encryption, this.session.data.permanent, undefined, this.onUploadProgress)
      if (data.data) {
        await this.addSessionToCollections(data.data.link_id)
        this.finished.emit(data.data.link_id)
        this.reset()
        this.updateProgressBar(100, "Finished")
        this.toast.show("User information", `Curtain link ${this.sessionId+1} saved with unique id ${data.data.link_id}`).then()
      }
    } catch (err) {
      this.updateProgressBar(100, "Error on upload")
      this.toast.show("User information", `Curtain link #${this.sessionId+1} cannot be saved`).then()
    }
  }

  onUploadProgress = (progressEvent: any) => {
    this.updateProgressBar(progressEvent.progress * 100, "Uploading session data at " + Math.round(progressEvent.progress *100) + "%")
  }

  readFileAsync(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("File reading failed"));
        }
      };
      reader.onerror = () => {
        reject(new Error("File reading failed"));
      };
      reader.readAsText(file);
    });
  }

  copySessionSettings() {
    if (this.session) {
      this.settings.settings.description = this.session.data.settings.description
      this.settings.settings.dataAnalysisContact = this.session.data.settings.dataAnalysisContact
      this.settings.settings.fetchUniprot = this.session.data.fetchUniProt
      this.settings.settings.volcanoAxis = this.session.data.settings.volcanoAxis
      this.settings.settings.volcanoPlotGrid = this.session.data.settings.volcanoPlotGrid
      this.settings.settings.volcanoPlotDimension = this.session.data.settings.volcanoPlotDimension
      this.settings.settings.volcanoAdditionalShapes = this.session.data.settings.volcanoAdditionalShapes
      this.settings.settings.volcanoPlotTitle = this.session.data.settings.volcanoPlotTitle
      this.settings.settings.volcanoPlotLegendX = this.session.data.settings.volcanoPlotLegendX
      this.settings.settings.volcanoPlotLegendY = this.session.data.settings.volcanoPlotLegendY
      this.settings.settings.volcanoPlotYaxisPosition = this.session.data.settings.volcanoPlotYaxisPosition
      this.settings.settings.customVolcanoTextCol = this.session.data.settings.customVolcanoTextCol
      this.settings.settings.defaultColorList = this.session.data.settings.defaultColorList
      this.settings.settings.pCutoff = this.session.data.settings.pCutoff
      this.settings.settings.log2FCCutoff = this.session.data.settings.log2FCCutoff
    }
  }

  defaultVolcanoColors() {
    if (this.session) {
      let currentPosition = 0
      const pConditions = ["P-value > ", "P-value <= "]
      const fcConditions = ["FC > ", "FC <= "]

      for (const p of pConditions) {
        for (const f of fcConditions) {
          if (currentPosition >= this.settings.settings.defaultColorList.length) {
            currentPosition = 0
          }
          if (!this.session.volcanoColors[p+f]) {
            this.session.volcanoColors[p+f] = {
              p: p,
              fc: f,
              color: this.settings.settings.defaultColorList[currentPosition]
            }
          }
          currentPosition ++
        }
      }
    }
  }

  updateDefaultPalette(palette: string) {
    if (this.session) {
      this.session.data.settings.defaultColorList = [...this.data.palette[palette]]
    }
  }

  updateDefaultVolcanoColorP(value:number) {
    if (this.session) {
      this.settings.settings.pCutoff = value
    }
  }

  updateDefaultVolcanoColorFC(value:number) {
    if (this.session) {
      this.settings.settings.log2FCCutoff = value
    }
  }

  clearComparisonSelection(): void {
    if (this.session) {
      this.session.data.differentialForm.comparisonSelect = '';
      this.toast.show("Cleared", "Comparison selection has been cleared.");
    }
  }

  clearComparisonGroup(): void {
    if (this.session) {
      this.session.data.differentialForm.comparison = '';
      this.session.data.differentialForm.comparisonSelect = '';
      this.session.uniqueComparisons = [];
      this.toast.show("Cleared", "Comparison group and selection have been cleared.");
    }
  }

  autoMatchSampleColumns(): void {
    if (!this.session) {
      return;
    }

    try {
      const regex = new RegExp(this.autoMatchSampleColumnsPattern);
      const matchedColumns = this.session.rawColumns.filter(name => regex.test(name));

      if (matchedColumns.length > 0) {
        this.session.data.rawForm.samples = matchedColumns;
        this.toast.show("Success", `Matched ${matchedColumns.length} sample columns.`);
      } else {
        this.toast.show("Info", "No sample columns matched the pattern.");
      }
    } catch (error) {
      this.toast.show("Error", "Invalid regex pattern. Please check your pattern syntax.");
    }
  }

  private reset() {
    this.data.currentDF = new DataFrame()
    this.data.accessionToPrimaryIDs = {}
    this.data.primaryIDsList = []
    this.data.accessionList = []
    this.data.accessionMap = {}
    this.data.genesMap = {}
    this.data.allGenes = []
    this.data.selected = []
    this.data.selectedGenes = []
    this.data.selectedAccessions = []
    this.data.selectedMap = {}
    this.data.selectOperationNames = []
    this.data.dataMap = new Map<string, string>()
    this.uniprot.geneNameToPrimary = {}
    this.uniprot.accMap = new Map<string, string>()
    this.uniprot.dataMap = new Map<string, string>()
    this.settings.settings = new Settings()
  }
}

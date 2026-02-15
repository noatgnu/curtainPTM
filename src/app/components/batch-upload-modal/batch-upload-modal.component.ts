import { Component } from '@angular/core';
import {Settings} from "../../classes/settings";
import {FormBuilder, FormGroup} from "@angular/forms";
import {fromCSV} from "data-forge";
import {InputFile} from "../../classes/input-file";
import {Differential} from "../../classes/differential";
import {Raw} from "../../classes/raw";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {BatchUploadService} from "./batch-upload.service";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-batch-upload-modal',
  standalone: false,
  templateUrl: './batch-upload-modal.component.html',
  styleUrl: './batch-upload-modal.component.scss',
})
export class BatchUploadModalComponent {
  differentialFiles: File[] = [];
  rawFiles: File[] = [];

  sessions: {data: {
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
    colorPalette: string
  }[] = [];
  allTasksFinished = false

  constructor(
    private toasts: ToastService,
    private fb: FormBuilder,
    private dialogRef: NgbActiveModal,
    private batchService: BatchUploadService
  ) {
    this.batchService.taskStartAnnouncer.subscribe((index) => {
      this.toasts.show("Task started", `Start processing task ${index}`).then()
    })
  }

  handleDifferentialAnalysisFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      for (const f of files) {
        this.differentialFiles.push(f);
      }
    }
  }

  handleRawFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files) {
      for (const f of files) {
        this.rawFiles.push(f);
      }
    }
  }

  addSession() {
    const form = this.fb.group({
      raw: [null as File | null],
      differential: [null as File | null],
    })

    const data: {
      data: any,
      form: FormGroup,
      rawColumns: string[],
      differentialColumns: string[],
      rawFile: File | null,
      differentialFile: File | null,
      uniqueComparisons: string[],
      linkId: string | null,
      colorCategoryForms: FormGroup[],
      colorCategoryColumn: string,
      colorCategoryPrimaryIdColumn: string,
      private: boolean,
      volcanoColors: any,
      colorPalette: string
    } = {data: {
      raw: new InputFile(),
      rawForm: new Raw(),
      differentialForm: new Differential(),
      processed: new InputFile(),
      password: "",
      selections: [],
      selectionsMap: {},
      selectionsName: [],
      settings: new Settings(),
      fetchUniProt: true,
      annotatedData: null,
      extraData: null,
      permanent: false,
    },
      form,
      rawColumns: [],
      differentialColumns: [],
      rawFile: null,
      differentialFile: null,
      uniqueComparisons: [],
      linkId: null,
      colorCategoryForms: [],
      colorCategoryColumn: "",
      colorCategoryPrimaryIdColumn: "",
      private: true,
      volcanoColors: {},
      colorPalette: "pastel"
    }

    form.controls['raw'].valueChanges.subscribe((value: File | null) => {
      if (value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            data.rawColumns = df.getColumnNames()
            data.rawFile = value
            data.data.raw.filename = value.name
          }
        }
        reader.readAsText(value)
      }
    })

    form.controls['differential'].valueChanges.subscribe((value: File | null) => {
      if (value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            data.differentialColumns = df.getColumnNames()
            data.differentialFile = value
            data.data.processed.filename = value.name
          }
        }
        reader.readAsText(value)

        if (!data.data.settings.description || data.data.settings.description.trim() === '') {
          data.data.settings.description = value.name;
        }
      }
    })

    this.sessions.push(data)
  }

  close() {
    this.dialogRef.close()
  }

  submit() {
    this.allTasksFinished = false
    this.batchService.taskStartAnnouncer.next(0)
  }

  cloneSession(index: number) {
    const selectedSession = this.sessions[index]
    const data: {
      data: any,
      form: FormGroup,
      rawColumns: string[],
      differentialColumns: string[],
      rawFile: File | null,
      differentialFile: File | null,
      uniqueComparisons: string[],
      linkId: string | null,
      colorCategoryForms: FormGroup[],
      colorCategoryColumn: string,
      colorCategoryPrimaryIdColumn: string,
      private: boolean,
      volcanoColors: any,
      colorPalette: string
    } = {data: {
      raw: new InputFile(),
      rawForm: new Raw(),
      differentialForm: new Differential(),
      processed: new InputFile(),
      password: "",
      selections: [],
      selectionsMap: {},
      selectionsName: [],
      settings: new Settings(),
      fetchUniProt: true,
      annotatedData: null,
      extraData: null,
      permanent: false,
    }, form: this.fb.group({
      raw: [null as File | null],
      differential: [null as File | null],
    }),
      rawColumns: [],
      differentialColumns: [],
      rawFile: null,
      differentialFile: null,
      uniqueComparisons: [],
      linkId: null,
      colorCategoryForms: [],
      colorCategoryColumn: "",
      colorCategoryPrimaryIdColumn: "",
      private: true,
      volcanoColors: {},
      colorPalette: "pastel"
    }

    data.colorPalette = selectedSession.colorPalette.slice()
    data.volcanoColors = JSON.parse(JSON.stringify(selectedSession.volcanoColors))
    data.colorCategoryColumn = selectedSession.colorCategoryColumn.slice()
    data.colorCategoryPrimaryIdColumn = selectedSession.colorCategoryPrimaryIdColumn.slice()
    data.private = selectedSession.private

    for (const c of selectedSession.colorCategoryForms) {
      const colorForm = this.fb.group({
        color: [c.value.color],
        category: [c.value.category],
        value: [c.value.value],
        comparison: [c.value.comparison],
        label: [c.value.label]
      })
      data.colorCategoryForms.push(colorForm)
    }

    data.data.raw = JSON.parse(JSON.stringify(selectedSession.data.raw))
    data.data.rawForm = JSON.parse(JSON.stringify(selectedSession.data.rawForm))
    data.data.differentialForm = JSON.parse(JSON.stringify(selectedSession.data.differentialForm))
    data.data.processed = JSON.parse(JSON.stringify(selectedSession.data.processed))
    data.data.password = selectedSession.data.password
    data.data.selections = JSON.parse(JSON.stringify(selectedSession.data.selections))
    data.data.selectionsMap = JSON.parse(JSON.stringify(selectedSession.data.selectionsMap))
    data.data.selectionsName = JSON.parse(JSON.stringify(selectedSession.data.selectionsName))
    data.data.settings = JSON.parse(JSON.stringify(selectedSession.data.settings))
    data.data.fetchUniProt = selectedSession.data.fetchUniProt
    data.data.annotatedData = selectedSession.data.annotatedData ? JSON.parse(JSON.stringify(selectedSession.data.annotatedData)) : null
    data.data.extraData = selectedSession.data.extraData ? JSON.parse(JSON.stringify(selectedSession.data.extraData)) : null
    data.data.permanent = selectedSession.data.permanent

    data.form.patchValue({
      raw: selectedSession.form.value.raw,
      differential: selectedSession.form.value.differential,
    })

    data.rawColumns = [...selectedSession.rawColumns]
    data.differentialColumns = [...selectedSession.differentialColumns]
    data.rawFile = selectedSession.rawFile
    data.differentialFile = selectedSession.differentialFile
    data.uniqueComparisons = [...selectedSession.uniqueComparisons]

    data.form.controls['raw'].valueChanges.subscribe((value: File | null) => {
      if (value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            data.rawColumns = df.getColumnNames()
            data.rawFile = value
            data.data.raw.filename = value.name
          }
        }
        reader.readAsText(value)
      }
    })

    data.form.controls['differential'].valueChanges.subscribe((value: File | null) => {
      if (value) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            const loadedFile = e.target.result;
            const df = fromCSV(<string>loadedFile)
            data.differentialColumns = df.getColumnNames()
            data.differentialFile = value
            data.data.processed.filename = value.name
          }
        }
        reader.readAsText(value)

        if (!data.data.settings.description || data.data.settings.description.trim() === '') {
          data.data.settings.description = value.name;
        }
      }
    })

    this.sessions.push(data)
  }

  deleteSession(index: number) {
    this.sessions.splice(index, 1)
    this.sessions = [...this.sessions]
  }

  handleFinished(event: string, index: number) {
    if (!event || event === "") {
      this.sessions[index].linkId = null
      return
    }

    if (event) {
      this.sessions[index].linkId = location.origin + "/#/" + event
    }
    if (this.sessions[index+1]) {
      this.batchService.taskStartAnnouncer.next(index+1)
    } else {
      this.toasts.show("Task finished", "All tasks have been processed").then()
      this.allTasksFinished = true
    }
  }

  downloadLinkDocument() {
    const data = []
    for (let i = 0; i < this.sessions.length; i++) {
      data.push([i+1, this.sessions[i].linkId, this.sessions[i].data.settings.description])
    }
    const csv = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url= window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'links.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  openAllLinks() {
    let popupBlocked = false
    for (const session of this.sessions) {
      if (session.linkId) {
        const win = window.open(session.linkId, "_blank")
        if (!win) {
          popupBlocked = true
        }
      }
    }
    if (popupBlocked) {
      this.toasts.show(
        "Error",
        "Some or all links opening were blocked by your browser. Please allow popups for this site and try again.",
        10000, "error"
      ).then()
    }
  }

  exportSettingsButFiles(index: number) {
    const currentSession = this.sessions[index]
    if (currentSession) {
      const session = {
        data: {
          raw: null,
          rawForm: JSON.parse(JSON.stringify(currentSession.data.rawForm)),
          differentialForm: JSON.parse(JSON.stringify(currentSession.data.differentialForm)),
          processed: null,
          password: "",
          selections: [],
          selectionsMap: {},
          selectionsName: [],
          settings: JSON.parse(JSON.stringify(currentSession.data.settings)),
          fetchUniProt: currentSession.data.fetchUniProt,
          annotatedData: {},
          extraData: JSON.parse(JSON.stringify(currentSession.data.extraData)),
          permanent: currentSession.data.permanent,
        },
        colorCategoryForms: [],
        colorCategoryColumn: currentSession.colorCategoryColumn,
        colorCategoryPrimaryIdColumn: currentSession.colorCategoryPrimaryIdColumn,
        private: currentSession.private,
        volcanoColors: JSON.parse(JSON.stringify(currentSession.volcanoColors)),
        colorPalette: currentSession.colorPalette,
      }
      const a = document.createElement("a");
      const file = new Blob([JSON.stringify(session, null, 2)], {type: 'application/json'});
      a.href = URL.createObjectURL(file);
      a.download = 'curtain_ptm_batch_settings.json';
      a.click();
    }
  }

  importSettingsButFiles(event: any, index: number) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        const contents = e.target.result;
        if (contents) {
          const currentSession = this.sessions[index]
          if (currentSession) {
            const session = JSON.parse(<string>contents)
            if (currentSession) {
              if (session.data.rawForm.primaryIDs && currentSession.rawColumns.includes(session.data.rawForm.primaryIDs)) {
                currentSession.data.rawForm.primaryIDs = session.data.rawForm.primaryIDs
              }
              if (session.data.rawForm.samples && Array.isArray(session.data.rawForm.samples)) {
                const validSamples = session.data.rawForm.samples.filter((s: string) => currentSession.rawColumns.includes(s))
                if (validSamples.length > 0) {
                  currentSession.data.rawForm.samples = validSamples
                }
              }
              if (session.data.rawForm.log2 !== undefined) {
                currentSession.data.rawForm.log2 = session.data.rawForm.log2
              }

              if (session.data.differentialForm.primaryIDs && currentSession.differentialColumns.includes(session.data.differentialForm.primaryIDs)) {
                currentSession.data.differentialForm.primaryIDs = session.data.differentialForm.primaryIDs
              }
              if (session.data.differentialForm.geneNames && currentSession.differentialColumns.includes(session.data.differentialForm.geneNames)) {
                currentSession.data.differentialForm.geneNames = session.data.differentialForm.geneNames
              }
              if (session.data.differentialForm.accession && currentSession.differentialColumns.includes(session.data.differentialForm.accession)) {
                currentSession.data.differentialForm.accession = session.data.differentialForm.accession
              }
              if (session.data.differentialForm.foldChange && currentSession.differentialColumns.includes(session.data.differentialForm.foldChange)) {
                currentSession.data.differentialForm.foldChange = session.data.differentialForm.foldChange
              }
              if (session.data.differentialForm.significant && currentSession.differentialColumns.includes(session.data.differentialForm.significant)) {
                currentSession.data.differentialForm.significant = session.data.differentialForm.significant
              }
              if (session.data.differentialForm.comparison && currentSession.differentialColumns.includes(session.data.differentialForm.comparison)) {
                currentSession.data.differentialForm.comparison = session.data.differentialForm.comparison
                this.getComparisonColumnUniqueForImport(currentSession, session.data.differentialForm.comparison)
              }
              if (session.data.differentialForm.comparisonSelect && currentSession.uniqueComparisons.includes(session.data.differentialForm.comparisonSelect)) {
                currentSession.data.differentialForm.comparisonSelect = session.data.differentialForm.comparisonSelect
              }
              if (session.data.differentialForm.position && currentSession.differentialColumns.includes(session.data.differentialForm.position)) {
                currentSession.data.differentialForm.position = session.data.differentialForm.position
              }
              if (session.data.differentialForm.positionPeptide && currentSession.differentialColumns.includes(session.data.differentialForm.positionPeptide)) {
                currentSession.data.differentialForm.positionPeptide = session.data.differentialForm.positionPeptide
              }
              if (session.data.differentialForm.peptideSequence && currentSession.differentialColumns.includes(session.data.differentialForm.peptideSequence)) {
                currentSession.data.differentialForm.peptideSequence = session.data.differentialForm.peptideSequence
              }
              if (session.data.differentialForm.score && currentSession.differentialColumns.includes(session.data.differentialForm.score)) {
                currentSession.data.differentialForm.score = session.data.differentialForm.score
              }
              if (session.data.differentialForm.sequence && currentSession.differentialColumns.includes(session.data.differentialForm.sequence)) {
                currentSession.data.differentialForm.sequence = session.data.differentialForm.sequence
              }
              if (session.data.differentialForm.transformFC !== undefined) {
                currentSession.data.differentialForm.transformFC = session.data.differentialForm.transformFC
              }
              if (session.data.differentialForm.transformSignificant !== undefined) {
                currentSession.data.differentialForm.transformSignificant = session.data.differentialForm.transformSignificant
              }
              if (session.data.differentialForm.reverseFoldChange !== undefined) {
                currentSession.data.differentialForm.reverseFoldChange = session.data.differentialForm.reverseFoldChange
              }

              if (session.data.settings) {
                Object.assign(currentSession.data.settings, session.data.settings)
              }
              currentSession.data.fetchUniProt = session.data.fetchUniProt
              currentSession.data.extraData = session.data.extraData
              currentSession.data.permanent = session.data.permanent
              currentSession.volcanoColors = session.volcanoColors
              currentSession.colorPalette = session.colorPalette
              currentSession.colorCategoryColumn = session.colorCategoryColumn
              currentSession.colorCategoryPrimaryIdColumn = session.colorCategoryPrimaryIdColumn
              currentSession.colorCategoryForms = session.colorCategoryForms
              currentSession.private = session.private
            }
          }
        }
      }
    }
    reader.readAsText(file)
  }

  private getComparisonColumnUniqueForImport(session: any, columnComp: string) {
    if (session.differentialFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target) {
          const loadedFile = e.target.result;
          const df = fromCSV(<string>loadedFile)
          const column = df.getSeries(columnComp)
          session.uniqueComparisons = column.distinct().toArray()
        } else {
          session.uniqueComparisons = []
        }
      }
      reader.readAsText(session.differentialFile)
    }
  }
}

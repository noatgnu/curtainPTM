import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {InputFile} from "../../classes/input-file";
import {DataService} from "../../data.service";
import {DataFrame, fromCSV, fromJSON, Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-file-form',
  templateUrl: './file-form.component.html',
  styleUrls: ['./file-form.component.scss']
})
export class FileFormComponent implements OnInit {
  progressBar: any = {value: 0, text: ""}
  transformedFC: boolean = false
  transformedP: boolean = false
  @Output() finished: EventEmitter<boolean> = new EventEmitter<boolean>()
  constructor(private uniprot: UniprotService, public data: DataService, public settings: SettingsService) {
    this.uniprot.uniprotProgressBar.subscribe(data => {
      this.progressBar.value = data.value
      this.progressBar.text = data.text
    })
    this.data.restoreTrigger.asObservable().subscribe(data => {
      if (data) {
        this.startWork();
      }
    })
  }

  startWork() {
    this.finished.emit(false)
    if (typeof Worker !== 'undefined') {
      console.log("start worker")
      // Create a new
      const worker = new Worker(new URL('./data.worker', import.meta.url));
      worker.onmessage = (data: MessageEvent<any>) => {
        console.log(data.data)
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
                settings: this.settings.settings
              })
              this.data.raw.df = new DataFrame()
            } else if (data.data.type === "resultRaw") {
              this.data.raw.df = fromJSON(data.data.raw)
              this.data.sampleMap = data.data.sampleMap
              for (const s in this.settings.settings) {

                if (this.settings.settings.hasOwnProperty(s)) {
                  // @ts-ignore
                  this.settings.settings[s] = data.data.settings[s]
                }
              }
              this.data.conditions = data.data.conditions
              this.data.colorMap = data.data.colorMap
              this.processUniProt()
              worker.terminate()
            } else if (data.data.type === "resultDifferentialCompleted") {

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
      this.processFiles().then()
    }
  }

  ngOnInit(): void {
  }

  handleFile(e: InputFile, raw: boolean) {
    if (raw) {
      this.data.raw = e
    } else {
      this.data.differential = e
    }
  }

  updateProgressBar(value: number, text: string) {
    this.progressBar.value = value
    this.progressBar.text = text
  }
  convertToNumber(arr: string[]) {
    const newCol = arr.map(Number)
    return newCol
  }

  log2Convert(arr: number[]) {
    const newCol = arr.map(a => this.log2Stuff(a))
    return newCol
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
    const newCol = arr.map(a => -Math.log10(a))
    return newCol
  }

  async processFiles() {

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
      this.data.sampleMap[s] = {replicate: replicate, condition: condition}
      this.data.raw.df = this.data.raw.df.withSeries(s, new Series(this.convertToNumber(this.data.raw.df.getSeries(s).toArray()))).bake()
      sampleNumber ++
      this.updateProgressBar(sampleNumber*100/totalSampleNumber, "Processed "+s+" sample data")
    }
    if (this.settings.settings.conditionOrder.length === 0) {
      this.settings.settings.conditionOrder = conditions
    }
    this.data.colorMap = colorMap
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
    const numberedPosition = new Series(this.convertToNumber(
      this.data.currentDF.getSeries(
        this.data.differentialForm.position
      ).toArray())
    )

    this.data.currentDF = this.data.currentDF.withSeries(
      this.data.differentialForm.position,
      numberedPosition
        ).bake()

    this.data.currentDF = this.data.currentDF.withSeries(
      this.data.differentialForm.positionPeptide,
      new Series(
        this.convertToNumber(
          this.data.currentDF.getSeries(
            this.data.differentialForm.positionPeptide
          ).bake().toArray()))).bake()


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
    this.data.currentDF = this.data.currentDF.withSeries(this.data.differentialForm.peptideSequence, new Series(this.parseSequence())).bake()

    this.data.primaryIDsList = this.data.currentDF.getSeries(this.data.differentialForm.primaryIDs).bake().distinct().toArray()
    this.data.accessionList = this.data.currentDF.getSeries(this.data.differentialForm.accession).bake().distinct().toArray()
    for (const p of this.data.accessionList) {
      if (!this.data.accessionMap[p])  {
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
    this.processUniProt()
  }

  processUniProt() {

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

              this.finished.emit(true)
              this.updateProgressBar(100, "Finished")
            });
          })
        } else {
          this.finished.emit(true)
          this.updateProgressBar(100, "Finished")
        }
      } else {
        this.finished.emit(true)
        this.data.bypassUniProt = false
        this.updateProgressBar(100, "Finished")
      }

    } else {
      this.uniprot.geneNameToPrimary = {}
      if (this.data.differentialForm.geneNames !== "") {
        for (const r of this.data.differential.df) {
          if (r[this.data.differentialForm.geneNames] !== "") {
            const g = r[this.data.differentialForm.geneNames]
            if (!this.data.genesMap[g])  {
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
      this.finished.emit(true)
      this.updateProgressBar(100, "Finished")
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

  parseSequence() {
    return this.data.currentDF.getSeries(this.data.differentialForm.peptideSequence).bake().toArray().map(v => {
      let count = 0
      let seq = ""
      for (const a of v) {
        if (["(", "[", "{"].includes(a)) {
          count = count + 1
        }
        if (count === 0) {
          seq = seq + a
        }
        if ([")", "]", "}"].includes(a)) {
          count = count - 1
        }
      }
      return seq
    })
  }
}

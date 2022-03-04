import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame, fromCSV, Series} from "data-forge";
import {UniprotService} from "../../../services/uniprot.service";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {InputData} from "../../classes/input-data";
import {SettingsService} from "../../../services/settings.service";
import {DataService} from "../../../services/data.service";

@Component({
  selector: 'app-file-uploader',
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css']
})
export class FileUploaderComponent implements OnInit {
  data: InputData = new InputData()
  rawData: InputData = new InputData()
  progressBarValue: number = 0
  progressBarText: string = ""
  file: File|undefined;
  fetched: boolean = true
  accessionList: string[] = []
  form: FormGroup = this.fb.group({
    primaryIDComparisonCol: "Unique identifier",
    accessionCol: "Leading proteins",
    sequenceCol: "Sequence window",
    positionCol: "Position",
    positionPeptideCol: "Position in peptide",
    peptideSequenceCol: "Phospho (STY) Probabilities",
    comparisonCol: "Comparison",
    significantCol: "p-value: WT/KD",
    log10transform: false,
    score: "Localization prob",
    foldChangeCol: "Difference: WT/KD",
    log2transform: false,
    primaryIDRawCol: "T: Unique identifier",
    rawValueCols: [[], Validators.required]
  })

  constructor(private uniprot: UniprotService, private fb: FormBuilder, public settings: SettingsService, private dataService: DataService) {
    this.dataService.progressBarEvent.subscribe(data => {
      if (data) {
        this.progressBarText = data.event
        this.progressBarValue = 100/data.maxValue*data.value
      }
    })
    this.dataService.restoreTrigger.subscribe(data => {
      if (data) {
        this.rawData = this.dataService.rawDataFile
        this.data = this.dataService.dataFile
        const f: any = {}
        for (const v in this.form.value) {
          if (this.dataService.cols[v]) {
            if (v === "rawValueCols") {
              f[v] = [this.dataService.cols[v]]
            } else {
              f[v] = this.dataService.cols[v]
            }
          } else {
            f[v] = ""
          }
        }
        this.form = this.fb.group(f)
        this.getUniProt()
      }
    })
    this.uniprot.uniprotParseStatusObserver.subscribe(data => {
      if (data) {
        this.parseSampleValues()
        this.dataService.progressBarEvent.next({event: "Parse numeric values from raw file", value: 1, maxValue: 4})
        this.addGeneNameMap()
        this.dataService.progressBarEvent.next({event: "Map gene names", value: 2, maxValue: 4})
        this.parseComparisonValues()
        this.dataService.progressBarEvent.next({event: "Parse numeric values from differential analysis file", value: 3, maxValue: 4})
        this.dataService.dataFile = this.data
        this.dataService.rawDataFile = this.rawData
        this.dataService.primaryIDsList = this.rawData.data.getSeries(this.form.value.primaryIDRawCol).bake().toArray()
        this.dataService.cols = this.form.value
        let raw: string[] = []
        if (typeof(this.dataService.cols.rawValueCols[0]) !== "string") {
          raw = this.dataService.cols.rawValueCols[0]
        } else {
          raw = this.dataService.cols.rawValueCols
        }
        this.dataService.cols.rawValueCols = raw
        for (const c of raw) {
          const group = c.split(".")
          let condition = ""
          let replicate = ""
          if (group.length >= 3) {
            condition = group.slice(0, group.length-1).join("_")
            replicate = group[group.length-1]
          } else {
            condition = group[0]
            replicate = group[1]
          }
          this.dataService._conditionMap[c] = [condition, replicate]
        }

        this.dataService.finishedProcessing = true
        this.dataService.progressBarEvent.next({event: "Processing completed!", value: 4, maxValue: 4})
      }
    })
  }

  ngOnInit(): void {
  }

  handleFile(e: Event, raw: boolean) {
    if (e.target) {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.file = target.files[0];
        if (raw) {
          this.rawData.fileName = this.file.name
        } else {
          this.data.fileName = this.file.name
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const loadedFile = reader.result;
          if (raw) {
            this.rawData.data = fromCSV(<string>loadedFile)
          } else {
            this.data.data = fromCSV(<string>loadedFile)
          }

        };
        reader.readAsText(this.file);
      }
    }
  }

  getUniProt() {
    this.dataService.finishedProcessing = false
    this.dataService.cols = this.form.value
    if (this.fetched) {
      const accList: string[] = []
      this.uniprot.fetched = this.fetched
      this.accessionList = []
      for (const r of this.data.data) {
        const a = r[this.form.value.accessionCol]
        this.dataService.dataMap.set(a, r[this.form.value.primaryIDComparisonCol])
        this.dataService.dataMap.set(r[this.form.value.primaryIDComparisonCol], a)
        const d = a.split(";")
        for (const acc of d) {
          const accession = this.uniprot.Re.exec(acc)
          if (accession !== null) {
            this.uniprot.accMap.set(accession[0], a)
            this.uniprot.accMap.set(a, accession[0])
            if (!(this.accessionList.includes(accession[0]))) {
              this.accessionList.push(accession[0])
            }
            if (!this.uniprot.results.has(accession[0])) {
              accList.push(accession[0])
            }
            break
          }
        }
      }

      if (accList.length > 0) {
        console.log(this.accessionList)
        this.uniprot.UniProtParseGet(this.accessionList, false)
      }
    }
  }

  parseSampleValues() {
    let raw: string[] = []
    if (typeof(this.form.value.rawValueCols[0]) !== "string") {
      raw = this.form.value.rawValueCols[0]
    } else {
      raw = this.form.value.rawValueCols
    }
    for (const col of raw) {
      const d: any = []
      for (const c of this.rawData.data.getSeries(col).toArray()) {
        d.push(parseFloat(c))
      }
      this.rawData.data = this.rawData.data.withSeries(col, new Series(d)).bake()
    }
  }

  parseComparisonValues() {
    const temp: any = {}
    temp[this.form.value.positionCol] = []
    temp[this.form.value.score] = []
    temp[this.form.value.significantCol] = []
    temp[this.form.value.foldChangeCol] = []
    temp[this.form.value.positionPeptideCol] = []
    temp[this.form.value.peptideSequenceCol] = []
    temp["-log10(p)"] = []
    temp["log2(fc)"] = []
    for (const r of this.data.data) {
      const signi = parseFloat(r[this.form.value.significantCol])
      if (this.form.value.log10transform) {
        const log10s = -Math.log10(signi)
        temp["-log10(p)"].push(log10s)
      } else {
        temp[this.form.value.significantCol].push(signi)
      }
      const foldc = parseFloat(r[this.form.value.foldChangeCol])
      if (this.form.value.log2transform) {
        const log2f = Math.log2(foldc)
        temp["log2(fc)"].push(log2f)
      } else {
        temp[this.form.value.foldChangeCol].push(foldc)
      }
      temp[this.form.value.positionCol].push(parseInt(r[this.form.value.positionCol]))
      if (r[this.form.value.positionPeptideCol]) {
        temp[this.form.value.positionPeptideCol].push(parseInt(r[this.form.value.positionPeptideCol]))
      }

      if (r[this.form.value.peptideSequenceCol]) {
        let count = 0
        let seq = ""
        for (const a of r[this.form.value.peptideSequenceCol]) {
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
        temp[this.form.value.peptideSequenceCol].push(seq)
      }
      temp[this.form.value.score].push(parseFloat(r[this.form.value.score]))
    }

    for (const t in temp) {
      if (temp[t].length > 0) {
        this.data.data = this.data.data.withSeries(t, new Series(temp[t])).bake()
      }
    }
    const f: any = {}
    for (const v in this.form.value) {
      if (v === "rawValueCols") {
        f[v] = [this.form.value[v]]
      } else {
        if (v === "significantCol") {
          if (this.form.value.log10transform) {
            f[v] = "-log10(p)"
          } else {
            f[v] = this.form.value[v]
          }
        } else if (v === "foldChangeCol") {
          if (this.form.value.log2transform) {
            f[v] = "log2(fc)"
          } else {
            f[v] = this.form.value[v]
          }
        } else {
          f[v] = this.form.value[v]
        }
      }
    }
    this.form = this.fb.group(f)

  }

  addGeneNameMap() {
    for (const c of this.data.data) {
      if (!(this.dataService.accList.includes(c[this.form.value.accessionCol]))) {
        this.dataService.accList.push(c[this.form.value.accessionCol])
      }
      if (this.uniprot.accMap.has(c[this.form.value.accessionCol])) {
        const acc = this.uniprot.accMap.get(c[this.form.value.accessionCol])
        if (!(this.dataService.accList.includes(c[this.form.value.accessionCol]))) {
          this.dataService.accList.push(c[this.form.value.accessionCol])
        }
        const ac = this.uniprot.getUniprotFromPrimary(acc)
        if (ac) {
          if (!(this.dataService.geneList.includes(ac["Gene names"]))) {
            this.dataService.geneList.push(ac["Gene names"])
          }
          if (!(this.uniprot.geneNamesMap.has(ac["Gene names"]))) {
            this.uniprot.geneNamesMap.set(ac["Gene names"], [])
          }
          const ids = this.uniprot.geneNamesMap.get(ac["Gene names"])
          // @ts-ignore
          ids.push(
            {
              comparison: c[this.form.value.comparisonCol],
              primaryIDs: c[this.form.value.primaryIDComparisonCol]
            }
          )
          // @ts-ignore
          /*this.uniprot.geneNamesMap.set(g, ids)

          const geneNames = ac["Gene names"].split(";")
          // @ts-ignore
          this.uniprot.primaryIDsToGeneNamesMap.set(this.dataService.dataMap.get(c), geneNames)

          for (const g of geneNames) {
            if (!(this.uniprot.geneNamesMap.has(g))) {
              this.uniprot.geneNamesMap.set(g, [])
            }
            const ids = this.uniprot.geneNamesMap.get(g)
            // @ts-ignore
            ids.push(
              {
                comparison: c[this.form.value.comparisonCol],
                primaryIDs: c[this.form.value.primaryIDComparisonCol]
              }
            )
            // @ts-ignore
            this.uniprot.geneNamesMap.set(g, ids)
          }*/
        }
      }
    }
  }
}

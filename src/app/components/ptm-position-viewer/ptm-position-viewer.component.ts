import {Component, Input, OnInit} from '@angular/core';
import {UniprotService} from "../../uniprot.service";
import {DataFrame, IDataFrame} from "data-forge";
import {BiomsaService} from "../../biomsa.service";
import {forkJoin} from "rxjs";
import {PtmService} from "../../ptm.service";
import {PlotlyService} from "angular-plotly.js";
import {DataService} from "../../data.service";
import {PspService} from "../../psp.service";
import {WebService} from "../../web.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {NetphosKinasesComponent} from "../netphos-kinases/netphos-kinases.component";
import {KinaseInfoComponent} from "../kinase-info/kinase-info.component";
import {KinaseLibraryService} from "../../kinase-library.service";
import {KinaseLibraryModalComponent} from "../kinase-library-modal/kinase-library-modal.component";
import {PtmDiseasesService} from "../../ptm-diseases.service";

@Component({
  selector: 'app-ptm-position-viewer',
  templateUrl: './ptm-position-viewer.component.html',
  styleUrls: ['./ptm-position-viewer.component.scss']
})
export class PtmPositionViewerComponent implements OnInit {
  _data: any = {}
  uni: any = {}
  accessionID: string = ""
  differential: IDataFrame = new DataFrame()
  sequences: any = {}
  sourceMap: any = {}
  unidMap: any = {"Experimental Data": {}, "UniProt": {}}
  aligned: boolean = false
  divIDMap: any = {}
  order: string[] = ["Experimental Data", "UniProt"]
  significantAnnotation: any = {}
  graphLayout: any = {}
  graphData: any[] = []
  customRange: any = {}
  uniMods: any[] = []
  selectedUniProt: string[] = ["Phosphoserine", "Phosphotyrosine", "Phosphothreonine"]
  alignedMap: any = {}
  alignedPosition: any = {}
  _dbSelected: string[] = []
  currentLayout: any = {}
  netPhosMap: any = {}
  kinases: any = {}
  kinaseLibrary: any = {}
  kinaseLibraryOpenStatus: any = {}
  showPSPLink: boolean = false
  set dbSelected(value: string[]) {

    for (let d of this._dbSelected) {

      if (!value.includes(d)) {
        delete this.sourceMap[d]
        delete this.accOptions[d]
      }
    }
    this._dbSelected = value

    for (const v of value) {
      if (!this.accOptions[v]) {
        this.accOptions[v] = Object.keys(this.ptm.accessDB(this.ptm.databaseNameMap[v])[this.uni["Entry"]])
        this.sourceMap[v] = this.accOptions[v][0]
      }
    }
  }
  significantPos: number[] = []
  get dbSelected(): string[] {
    return this._dbSelected
  }
  accOptions: any = {}
  availableDB: string[] = []
  @Input() set data(value: any) {
    this._data = value
    console.log(value)
    this.accessionID = this._data.accessionID
    if (!(Object.keys(this.sourceMap).length > 0)) {
      this.sourceMap = this._data.sourceMap
    }
    const uni = this.uniprot.getUniprotFromAcc(this.accessionID)
    if (uni) {
      this.getKinaseLibrary()
      this.uni = uni
      const mods: any = {}
      this.uni["Modified residue"].forEach((m: any) => {

        if (!mods[m.modType]) {
          mods[m.modType] = []
        }
        mods[m.modType].push(m)
      })
      this.uniMods = Object.keys(mods)
      for (const d of this.ptm.databases) {
        if (d.value !== "GLYCONNECTN" && d.value !== "GLYCONNECTO") {
          const db = this.ptm.accessDB(d.value)
          if (db[this.uni["Entry"]]) {
            this.availableDB.push(d.name)
          }
        }
      }
    }
    if (this.dataService.dbIDMap[this.accessionID]) {
      const a = Object.keys(this.dataService.dbIDMap[this.accessionID])
      if (a.length > 0) {
        for (const o of a) {
          if (o !== "UniProt" && o !== "Experimental Data") {
            this._dbSelected.push(o)
          }
        }
        for (const d of this._dbSelected) {
          const dbName = this.ptm.databaseNameMap[d]
          const db = this.ptm.accessDB(dbName)
          this.accOptions[d] = Object.keys(db[this.uni["Entry"]])
          this.sourceMap[d] = this.dataService.dbIDMap[this.accessionID][d]
          console.log(this.sourceMap)
        }
      }
    } else {
      this.dataService.dbIDMap[this.accessionID] = {}
    }


    this.differential = this._data.differential
    this.sequences = this._data.sequences


    this.unidMap["Experimental Data"] = {}
    for (const u of this._data.unidList) {
      if (!this.unidMap["Experimental Data"][u.position-1]) {
        this.unidMap["Experimental Data"][u.position-1] = []
      }
      this.unidMap["Experimental Data"][u.position-1].push(u)
      if (u.significant) {
        this.significantPos.push(u.position-1)
      }
    }
    if (this._data.accessionID) {

      this.aligned = this._data.aligned
      this.ptm.getGlyco(this.uni["Entry"]).then()
      this.align().then(r => {
        this.web.postNetphos(this.sourceMap["Experimental Data"], this.sequences[this.sourceMap["Experimental Data"]]).subscribe(data => {
          if (data.body) {
            console.log(data.body)
            // @ts-ignore
            this.netPhosMap = this.parseNetphos(data.body["data"])
          }
        })
        this.gatherMods()
        this.drawHeatmap().then()
      })
    }
  }
  constructor(private ptmd: PtmDiseasesService, private kinaseLib: KinaseLibraryService, private modal: NgbModal, private web: WebService, public psp: PspService, private uniprot: UniprotService, private msa: BiomsaService, public ptm: PtmService, private plot: PlotlyService, public dataService: DataService) {

  }

  ngOnInit(): void {
  }

  async drawHeatmap() {
    this.showPSPLink = false
    const temp: any = {}
    const gapCount: any = {}
    const labels: string[] = Object.keys(this.sourceMap)
    this.significantAnnotation = []
    for (let i = 0; i < labels.length; i++) {
      this.dataService.dbIDMap[this.accessionID][labels[i]] = this.sourceMap[labels[i]]
      this.currentLayout[labels[i]] = [0,0]
      this.divIDMap[labels[i]] = labels[i].replace(/\s/g, "") + this.sourceMap[labels[i]]
      this.graphLayout[labels[i]] = {
        xaxis: {
          showticklabels: false,
          type: 'category',
          tickmode: 'array',
          visible: false,
        }, yaxis : {
          showticklabels: false,
          range: [0,1.3],
          visible: false,
          fixedrange: true
        }, title: labels[i] + " <b>"  + this.sourceMap[labels[i]] + "</b>",
        margin: {t: 25, b: 25, r: 25, l: 25},
        hovermode: false
      }
      temp[labels[i]] = {
        x: [],
        y: [],
        type: "bar",
        text: [],
        marker: {
          color: []
        },
        name: labels[i],
        showlegend: false
      }
      gapCount[labels[i]] = 0
    }
    const modified = this.composeGraphData("Experimental Data", temp, gapCount,
      'rgb(236,96,99)'
    )

    this.alignedMap["Experimental Data"] = modified
    console.log(this.alignedMap["Experimental Data"])
    console.log(this.dataService.selectedMap)
    for (const t of labels) {
      if (t.startsWith("PhosphoSite Plus")) {
        this.showPSPLink = true
      }
      if (t !== "Experimental Data") {
        this.alignedMap[t] = this.composeGraphData(t, temp, gapCount);

        for (const m of modified) {
          if (temp[t].marker.color[m.alignedPosition].startsWith('rgba(154, 220, 255')) {
            temp[t].marker.color[m.alignedPosition] = temp[t].marker.color[m.alignedPosition].replace('rgba(154, 220, 255', 'rgba(209, 140, 224')
            if (temp["Experimental Data"].marker.color[m.alignedPosition] !== 'rgba(114,220,0,0.85)') {
              temp["Experimental Data"].marker.color[m.alignedPosition] = 'rgba(209, 140, 224,1)'
            }
          }
        }
      }
    }
    const kinaseAcc: string[] = []
    const accs: string[] = []
    for (const t in this.alignedMap) {
      for (const a of this.alignedMap[t]) {
        if (!this.alignedPosition[a.alignedPosition]) {
          this.alignedPosition[a.alignedPosition] = {}
        }
        if (!this.alignedPosition[a.alignedPosition][t]) {
          this.alignedPosition[a.alignedPosition][t] = a
        }
        if (t === "UniProt") {
          if (this.ptmd.getPTMDiseases(this.uni["Entry"])) {
            this.alignedPosition[a.alignedPosition][t]["diseases"] = this.ptmd.getPTMDiseases(this.uni["Entry"]).filter((d: any) => {
             return d.position === a.actualPosition+1
            })
          }
        }
        if (t === "PhosphoSite Plus (Phosphorylation)") {
          this.alignedPosition[a.alignedPosition][t]["kinases"] = this.getKinase(a.actualPosition)
          for (const k of this.alignedPosition[a.alignedPosition][t]["kinases"]) {
            const uni: any = this.uniprot.getUniprotFromAcc(k.acc)
            const accession = this.uniprot.Re.exec(k.acc)
            if (accession) {
              if (!uni) {
                this.dataService.dataMap.set(k.acc, accession[1])
                this.uniprot.accMap.set(k.acc, accession[1])
                kinaseAcc.push(accession[1])
                accs.push(k.acc)
              } else {
                this.kinases[k.acc] = uni
              }
            }
          }
        }
      }
    }
    if (kinaseAcc.length > 0) {
      await this.uniprot.UniprotParserJS(kinaseAcc)
      for (const k of accs) {
        this.kinases[k] = this.uniprot.getUniprotFromAcc(k)
      }
    }
    this.graphData = Object.values(temp)
  }

  private composeGraphData(t: string, temp: any, gapCount: any, foundColor: string = 'rgba(154, 220, 255, 0.75)') {
    const modified: any[] = []
    const acc = this.sourceMap[t]
    const seq = this.sequences[acc]
    for (let i = 0; i < seq.length; i++) {
      temp[t].x.push(seq[i] + "." + (i + 1))
      let val = 1
      let color = 'rgb(238, 238, 238)'
      if (seq[i] === "-") {
        gapCount[t] = gapCount[t] + 1
        temp[t].text.push("-")
      } else {
        const actualPosition = i - gapCount[t]
        if (this.unidMap[t][actualPosition]) {
          const mod: any = {alignedPosition: i, actualPosition: actualPosition, gapCount: 0 + gapCount[t]}

          temp[t].text.push(seq[i] + "(" + (actualPosition + 1) + "): Modified")
          val = 1
          if (this.unidMap[t][actualPosition][0]) {
            const unid = this.unidMap[t][actualPosition]
            let match = false
            for (const u of unid) {
              if (u.id) {
                mod["id"] = u.id
                //color = 'rgba(154, 220, 255' + u.score + ')'
                color = 'rgba(154, 220, 255)'
                if (!this.significantAnnotation[t]) {
                  this.significantAnnotation[t] = []
                }
                if (actualPosition && t==="Experimental Data") {
                  const result = this.significantPos.find((p: number) => p === actualPosition)
                  if (result) {
                    this.significantAnnotation[t].push({
                      x: mod.alignedPosition,
                      y: 1.25,
                      text: "*",
                      showarrow: false,
                      arrowhead: 2,
                      ax: 0,
                      ay: 0,
                      font: {
                        size: 10,
                        color: 'rgb(217,4,4)'
                      }
                    })
                  }
                }
                console.log(u.id)
                if (this.dataService.selectedMap[u.id]) {
                  //color = 'rgba(0,220,4,' + u.score +')'
                  console.log(u.id)
                  color = 'rgba(114,220,0,0.85)'
                  match = true
                  //break
                }
              }
            }
            if (!match) {
              color = foundColor
            }
          } else {
            color = foundColor
          }
          modified.push(mod)
        } else {
          temp[t].text.push(seq[i] + "(" + (actualPosition + 1) + ")")
          color = 'rgba(255,178,166,0.3)'
        }
      }
      temp[t].y.push(val)
      temp[t].marker.color.push(color)
    }
    if (this.significantAnnotation[t]) {
      this.graphLayout[t].annotations = this.significantAnnotation[t]
    }
    if (this.customRange.length > 0) {
      this.graphLayout[t].xaxis.range = this.customRange
    }
    return modified
  }

  updateBoundary(event: any) {
    this.customRange = [event["xaxis.range[0]"], event["xaxis.range[1]"]]
    // for (const s in this.sourceMap) {
    //   if (this.graphLayout[s]) {
    //     if ((this.customRange[0] !== this.currentLayout[s][0]) || (this.customRange[1] !== this.currentLayout[s][1])) {
    //       this.currentLayout[s] = [...this.customRange]
    //       const div = this.plot.getInstanceByDivId(this.divIDMap[s])
    //       this.plot.getPlotly().then(r=> {
    //         console.log(r)
    //         r.relayout(div, {"xaxis.range": this.customRange}, 0)
    //       })
    //     }
    //   }
    // }
    this.drawHeatmap().then()
  }

  async align() {
    const tobeAlign: any = {}
    for (const s in this.sequences) {
      tobeAlign[s] = this.sequences[s].replace(/-/g, "")
    }
    const tobeRetrieve: any = {}
    for (const v of Object.values(this.sourceMap)) {
      if (!tobeAlign[<string>v]) {
        tobeRetrieve[<string>v] = this.uniprot.getUniprotFasta(<string>v)
      }
    }

    if (Object.keys(tobeRetrieve).length > 0) {
      const results: any = await forkJoin(tobeRetrieve).toPromise()
      if (results) {
        for (const r in tobeRetrieve) {
          tobeAlign[r] = this.uniprot.parseFasta(results[r])
        }
      }
    }
    if (Object.keys(tobeAlign).length > 1) {
      const msa = await this.msa.alignSequences(tobeAlign)
      const seqLabels = Object.keys(tobeAlign)
      for (let i = 0; i < seqLabels.length; i ++) {
        this.sequences[seqLabels[i]] = msa[i]
      }
    }
    console.log(this.sequences)
  }

  gatherMods() {
    this.uni["Modified residue"].forEach((m: any) => {
      if (this.selectedUniProt.includes(m.modType)) {
        this.unidMap["UniProt"][m.position - 1] = m
      }
    })
    for (const d of this.dbSelected) {

      const dbName = this.ptm.databaseNameMap[d]
      const db = this.ptm.accessDB(dbName)
      console.log(d)
      console.log(this.accOptions)
      if (!this.accOptions[d]) {
        this.accOptions[d] = Object.keys(db[this.uni["Entry"]])
        this.sourceMap[d] = this.accOptions[d][0]
      }
      this.unidMap[d] = {}
      console.log(this.sourceMap)
      for (const m of db[this.uni["Entry"]][this.sourceMap[d]]) {
        this.unidMap[d][m.position] = m
      }
    }
  }

  reDraw() {
    this.align().then(r => {
      this.gatherMods()
      this.drawHeatmap().then()
    })
  }

  relayout() {

  }

  getKinase(position: number) {
    const a = this.psp.substrateKinaseMap[this.uni["Entry"]]
    if (a) {
      const b = a[this.sourceMap["PhosphoSite Plus (Phosphorylation)"]]
      if (b) {
        if (b[position]) {
          return b[position]
        }
      }
    }
    return []
  }

  parseNetphos(data: string) {
    const lines = data.split("\n")
    const dataO: any = {}
    for (const line of lines) {
      const d: any = line.split(" ")
      if (d.length >1) {
        const row = {id: d[2], res: d[1], pos: parseInt(d[3]), score: parseFloat(d[4]), kinase: d[6].replace("\t", "")}
        if (!dataO[row.pos]) {
          dataO[row.pos] = []
        }
        dataO[row.pos].push(row)
      }
    }
    for (const d in dataO) {
      dataO[d].sort(function (a:any, b:any) {
        return b.score - a.score
      })
    }
    return dataO
  }

  openNetPhos(position: number) {
    const ref = this.modal.open(NetphosKinasesComponent)
    console.log(position)
    console.log(this.netPhosMap)

    ref.componentInstance.data = this.netPhosMap[position]
  }

  openKinaseInfo(kinase: any) {
    console.log(this.kinases)
    console.log(kinase)
    const ref = this.modal.open(KinaseInfoComponent, {size: "xl"})
    ref.componentInstance.uni = this.kinases[kinase.acc]
  }

  downloadSVG(){
    for (const g of this.graphData) {
      this.web.downloadPlotlyImage("svg", this.divIDMap[g.name], this.divIDMap[g.name])
    }
  }

  getKinaseLibrary() {
    this.kinaseLib.get_kinase(this._data.accessionID).subscribe((data:any) => {
      for (const i of data.results) {
        const result: any[] = []
        for (const k in i.data) {
          i.data[k]["kinase"] = k
          result.push(i.data[k])
        }
        i.data = result.sort((a:any,b:any) => {
          return b.percentile - a.percentile
        })
        this.kinaseLibrary[i.position.toString()] = i
        this.kinaseLibraryOpenStatus[i.position.toString()] = false
      }
    })
  }

  toggleKinaseLibraryOpenStatus(position: number) {

    const ref = this.modal.open(KinaseLibraryModalComponent, {scrollable: true})
    const sequence = this.sequences[this.sourceMap["Experimental Data"]].replace("-", "")
    const site = sequence[position-1]
    const prefix = sequence.slice(position-11, position-1)
    const suffix = sequence.slice(position, position+10)
    ref.componentInstance.sequenceWindow = prefix + site.toLowerCase() + "*" + suffix
    if (this.kinaseLibrary[position.toString()]) {
      ref.componentInstance.data = this.kinaseLibrary[position.toString()]
    } else {
      this.kinaseLib.getKinaseLibrary(ref.componentInstance.sequenceWindow).subscribe((data:any) => {
        ref.componentInstance.directData = data["scores"]
      })
    }


  }
}

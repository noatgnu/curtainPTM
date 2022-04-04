import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {UniprotService} from "../../../services/uniprot.service";
import {DataService} from "../../../services/data.service";
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";
import {PlotlyService} from "angular-plotly.js";
import {forkJoin, Observable, Subject, Subscription} from "rxjs";
import {SettingsService} from "../../../services/settings.service";
import {PspService} from "../../../services/psp.service";
import {WebService} from "../../../services/web.service";


@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css']
})
export class HeatmapComponent implements OnInit, OnDestroy {
  dbPTMMap: any = {}
  accMap: any = {}
  opacityMap: any = {}
  significant = {max: 0, min: 0}
  foldChange = {max: 0, min: 0}
  _data = ""
  titleOrder = ["Uniprot", "Experimental Data", "PSP_PHOSPHO", "PLMD_UBI"]
  selectedUID: any[] = []
  df: IDataFrame = new DataFrame()
  form: FormGroup = this.fb.group({
    modificationTypes: [[
      "Phosphoserine",
      "Phosphothreonine",
      "Phosphotyrosine"
    ]],
    dbSelected: [this.dataService.databases.map(d => d.value)],
    pspSelected: ""
  })
  customRange: any = []
  modTypes: string[] = []
  uniprotEntry: string = ""
  unidStack: any = {}
  selectedPosition: number|undefined
  observeChange: Subscription | undefined
  heatmapEnable: boolean = false
  expDataAcc: string = ""
  maxSeqLength = 0
  availableDB: string[] = []
  ptmSelected: any = {}
  @Input() set data(value: string)  {
    if (value) {
      this._data = value
      if (this.dataService.observableTriggerMap[this._data]) {
        if (this.observeChange === undefined) {
          this.observeChange = this.dataService.observableTriggerMap[this._data].subscribe((data:boolean) => {
            if (data) {
              this.processData()
            }
          })
        } else {

        }

      }
      this.processData();
    }
  }

  private processData() {
    const d = this.uniprot.getUniprotFromPrimary(this._data)

    if (d) {
      this.sequence[d["Entry"]] = d["Sequence"]
      this.uniprotEntry = d["Entry"]
      this.accMap["Uniprot"] = this.uniprotEntry
      this.positions["Uniprot"] = d["Modified residue"]
      const seqNeeded: any = {}
      const accs = this._data.split(";")
      this.expDataAcc = accs[0]
      this.accMap["Experimental Data"] = this.expDataAcc
      if (this.expDataAcc !== this.uniprotEntry) {
        if (!this.sequence[this.expDataAcc]) {
          if (this.uniprot.fastaMap[this.expDataAcc]) {
            this.sequence[this.expDataAcc] = this.uniprot.fastaMap[this.expDataAcc].slice()
          } else {
            seqNeeded[this.expDataAcc] = this.uniprot.getUniprotFasta(this.expDataAcc)
          }
        }
      }
      const dab: string[] = []
      for (const db of this.form.value["dbSelected"]) {
        if (this.web.accessDB(db)[this.uniprotEntry] || this.web.accessDB(db)[this.expDataAcc]) {
          if (!this.dataService.dbIDMap[db]) {
            this.dataService.dbIDMap[db] = {}
            if (!dab.includes(db)) {
              dab.push(db)
            }
          } else {
            if (!dab.includes(db)) {
              dab.push(db)
            }
          }

          if (!this.dataService.dbIDMap[db][this._data]) {
            this.dataService.dbIDMap[db][this._data] = {selected: this.uniprotEntry, associated: [this.uniprotEntry]}
            if (this.web.accessDB(db)[accs[0]]) {
              this.dataService.dbIDMap[db][this._data].selected = accs[0]
            }
          }
          for (const acc of accs) {
            if (this.web.accessDB(db)[acc]) {
              if (!this.sequence[acc]) {
                if (this.uniprot.fastaMap[acc]) {
                  this.sequence = this.uniprot.fastaMap[acc].slice()
                } else {
                  if (!seqNeeded[acc]) {
                    seqNeeded[acc] = this.uniprot.getUniprotFasta(acc)
                  }
                }
              }
              if (!this.dataService.dbIDMap[db][this._data].associated.includes(acc)) {
                this.dataService.dbIDMap[db][this._data].associated.push(acc)
              }
            }
          }
        } else {

        }
      }
      this.availableDB = dab
      this.form = this.fb.group({
        modificationTypes: [[
          "Phosphoserine",
          "Phosphothreonine",
          "Phosphotyrosine"
        ]],
        dbSelected: [dab],
        pspSelected: this.dataService.dbIDMap["PSP_PHOSPHO"][this._data].selected
      })
      const mods: string[] = []
      for (const m of this.positions["Uniprot"]) {
        if (!(mods.includes(m.modType))) {
          mods.push(m.modType)
        }
      }
      this.modTypes = mods
      const q = this.dataService.queryMap.get(this._data)
      if (q) {
        this.queries = q
        this.selectedUID = []
        for (const c in this.queries) {
          for (const s of this.queries[c]) {
            if (!this.selectedUID.includes(s)) {
              this.selectedUID.push(s)
            }
          }
        }
        this.df = this.dataService.dataFile.data.where(row => (row[this.dataService.cols.accessionCol] === this._data)&&
          (row[this.dataService.cols.comparisonCol] === this.settings.settings.currentComparison)).bake()
        this.changeDF = this.dataService.dataFile.data.where(row => this.selectedUID.includes(row[this.dataService.cols.primaryIDComparisonCol])&&
          (row[this.dataService.cols.comparisonCol] === this.settings.settings.currentComparison)).bake()
        const sign = this.df.getSeries(this.dataService.cols.significantCol).bake()
        this.significant.max = sign.max()
        this.significant.min = sign.min()
        const fc = this.df.getSeries(this.dataService.cols.foldChangeCol).bake()
        this.foldChange.max = fc.max()
        this.foldChange.min = fc.min()

        this.positions["Experimental Data"] = []

        for (const p of this.df) {
          if (p[this.dataService.cols.score] >= this.settings.settings.probabilityFilterMap[this._data]) {
            const pos = p[this.dataService.cols.positionCol] -1
            this.opacityMap[pos] = (p[this.dataService.cols.foldChangeCol]-this.significant.min)/(this.significant.max - this.significant.min) * 0.75 +0.25
            if (!isFinite(this.opacityMap[pos])) {
              this.opacityMap[pos] = 1
            }
            let ap = true
            for (const r of this.positions["Experimental Data"]) {
              if (r.res === pos) {
                ap = false
              }
            }
            if (ap) {
              this.positions["Experimental Data"].push({res: pos, unid: p[this.dataService.cols.primaryIDComparisonCol]})
              this.unidStack[p[this.dataService.cols.primaryIDComparisonCol]] = pos
            }
          }
        }

      }
      if (this.unidStack[this.dataService.justSelected]) {
        this.selectedPosition = this.unidStack[this.dataService.justSelected]
      }
      const accx = Object.keys(seqNeeded)

      if (accx.length > 0) {
        forkJoin(seqNeeded).subscribe(results => {
          if (results) {
            for (const s in seqNeeded) {
              // @ts-ignore
              this.sequence[s] = this.uniprot.parseFasta(results[s])
              // @ts-ignore
              this.web.postNetphos(s, results[s]).subscribe(data => {
                if (data.body) {
                  // @ts-ignore
                  this.dataService.netphosMap[s] = this.dataService.parseNetphos(data.body["data"])
                }
              })
              this.uniprot.fastaMap[s] = this.sequence[s].slice()
            }
            this.uniprot.alignSequences(this.sequence).then((data) => {
              const seqLabels = Object.keys(this.sequence)

              for (let i = 0; i < seqLabels.length; i ++) {
                this.sequence[seqLabels[i]] = data[i]
              }
              this.draw()
            })
          }
        })
      } else {
        if (Object.keys(this.sequence).length > 1) {
          for (const s of Object.keys(this.sequence)) {
            this.web.postNetphos(s, this.sequence[s]).subscribe(data => {
              if (data.body) {
                // @ts-ignore
                this.dataService.netphosMap[s] = this.dataService.parseNetphos(data.body["data"])
                console.log(this.dataService.netphosMap[s])
              }
            })
          }
          this.uniprot.alignSequences(this.sequence).then((data) => {
            const seqLabels = Object.keys(this.sequence)

            for (let i = 0; i < seqLabels.length; i ++) {
              this.sequence[seqLabels[i]] = data[i]

            }
            this.draw()
          })
        } else {
          for (const s of Object.keys(this.sequence)) {
            this.web.postNetphos(s, this.sequence[s]).subscribe(data => {
              if (data.body) {
                // @ts-ignore
                this.dataService.netphosMap[s] = this.dataService.parseNetphos(data.body["data"])
                console.log(this.dataService.netphosMap[s])
              }
            })
          }

          this.draw()
        }

      }
    }
  }

  drawTrigger: Subject<boolean> = new Subject<boolean>()

  queries: any[] = []
  changeDF: IDataFrame = new DataFrame()
  sequence: any = {}
  positions: any = {}
  windows = 21
  graphData: any[] = []
  graphData2: any = {}
  graphLayout: any = {
    xaxis: {
      type: 'category',
      tickmode: 'array',
      tickvals: [],
    }
  }

  graphLayout2: any = {
    xaxis: {
      type: 'category',
      tickmode: 'array',
      tickvals: [],
    },
    annotations: []
  }
  constructor(private psp: PspService, private uniprot: UniprotService, public dataService: DataService, private fb: FormBuilder, public plotly: PlotlyService, public settings: SettingsService, private web: WebService) {
    this.dataService.selectionNotifier.subscribe(data => {
      if (data) {
        if (this.unidStack[this.dataService.justSelected]) {
          this.selectedPosition = this.unidStack[this.dataService.justSelected]
          this.draw()
        }
      }
    })
  }

  drawHeatmap() {
    for (const db of this.form.value["dbSelected"]) {
      if (this.dataService.dbIDMap[db]) {
        if (this.dataService.dbIDMap[db][this._data]) {
          this.positions[db] = this.web.accessDB(db)[this.dataService.dbIDMap[db][this._data].selected]
        }
      }

    }


    const seqLength = this.maxSeqLength
    const z: any = {}
    const seq: any = {}
    const seqNames: string[] = []
    const barData: any = {}
    const uniprotPosition: number[] = []
    const tempPosition: any = {}
    for (const n of this.positions["Uniprot"]) {
      if (this.form.value.modificationTypes.includes(n.modType)) {
        uniprotPosition.push(n)
      }
    }

    for (let i = 0; i < seqLength; i++) {

      seq.push(this.sequence[i] + "." + (i+1))
    }

    for (const u in this.positions) {

      if ((u !== "Uniprot")) {
        tempPosition[u] = this.positions[u]
      }
    }
    tempPosition["Uniprot"] = uniprotPosition
    const alignedExpPos: number[] = []
    for (const u in tempPosition) {
      z[u] = []
      barData[u] = {
        x: [],
        y: [],
        text: [],
        type: "bar",
        marker: {
          color: []
        },
        name: u
      }
      seqNames.push(u)
      for (let i = 0; i < seqLength; i++) {
        let start = i - ((this.windows - 1) / 2) - 1
        let end = i + ((this.windows - 1) / 2) + 1
        if (start < 0) {
          start = 0
        } else if (seqLength < end) {
          end = seqLength
        }
        let score = 0
        let match = false
        let matchColor = 'rgba(222,45,38,0.1)'
        for (const p of tempPosition[u]) {
          if (this.heatmapEnable) {
            if (start < p.res && end > p.res) {
              score += 1
            }
          }
          if (p.res === i) {
            match = true
            if (this.selectedPosition !== undefined) {
              if (p.res === this.selectedPosition) {
                matchColor = 'rgba(78,222,38,0.8)'
              }
            } else {
              if (u === "Experimental Data") {
                matchColor = 'rgba(222,45,38,'+this.opacityMap[i] + ')'

              }
            }
          }
        }
        if (match) {
          barData[u].y.push(2)
          barData[u].text.push(seq[i] + "(Modified)")

          barData[u].marker.color.push(matchColor)
        } else {
          barData[u].y.push(1)
          barData[u].text.push(seq[i])
          barData[u].marker.color.push('rgba(248,219,217,0.8)')
        }
        if (score > 0) {
          z[u].push(score)
        } else {
          z[u].push(null)
        }
      }
    }
    if (this.heatmapEnable) {
      this.graphLayout.xaxis.tickvals = seq
    }

    const rz: any[] = []
    for (const u in z) {
      rz.push(z[u])
      barData[u].x = seq
    }
    this.graphData2 = barData
    const temp: any = {
      x: seq,
      z: rz,
      y: seqNames,
      type: 'heatmap',
      colorscale: 'Viridis',
      showscale: false
    }
    if (this.heatmapEnable) {
      this.graphData = [temp]
      this.graphLayout = {
        xaxis: {
          showticklabels: false,
          type: 'category',
          tickmode: 'array',
          tickvals: seq,
          visible: false
        },
        height: temp.y.length * 100,
        margin: {t: 25, b: 25, r: 200, l: 200},
        plot_bgcolor: "#f1f1f1"
      }
      if (this.customRange.length > 0) {
        this.graphLayout.xaxis.range = this.customRange
      }
    }

    for (const u in z) {
      this.graphLayout2[u] = {
        title: u,
        xaxis: {
          showticklabels: false,
          type: 'category',
          tickmode: 'array',
          tickvals: seq,
          visible: false
        },
        yaxis: {
          showticklabels: false,
          range: [0,2],
          visible: false
        },
        height: temp.y.length * 75,
        margin: {t: 25, b: 25, r: 200, l: 200},
      }
      switch (u) {
        case "Uniprot":
          this.graphLayout2[u].title = this.graphLayout2[u].title + " " + this.uniprotEntry
          break
        case "PSP":
          this.graphLayout2[u].title = this.graphLayout2[u].title + " " + this.dataService.pspIDMap[this._data].selected
          break
        case "Experimental Data":
          this.graphLayout2[u].title = this.graphLayout2[u].title + " " + this._data
          break
        default:
          break
      }

      if (this.customRange.length > 0) {
        this.graphLayout2[u].xaxis.range = this.customRange
      }
    }


  }
  setSeqArray(accession: string, seqLength: number) {
    const seq = []
    for (let i = 0; i < seqLength; i++) {
      if (this.sequence[accession][i]) {
        seq.push(this.sequence[accession][i] + "." + (i+1))
      } else {
        seq.push("_")
      }
    }
    return seq
  }
  drawBarChart() {
    for (const db of this.form.value["dbSelected"]) {
      if (this.dataService.dbIDMap[db]) {
        if (this.dataService.dbIDMap[db][this._data]) {
          console.log(db)

          this.positions[db] = this.web.accessDB(db)[this.dataService.dbIDMap[db][this._data].selected]
          console.log(this.positions[db])
          this.accMap[db] = this.dataService.dbIDMap[db][this._data].selected
          console.log(this.positions)
        }
      }

    }
    console.log(this.positions)
    const seqLength = this.maxSeqLength
    const z: any = {}
    const seq: any = {}
    const barData: any = {}

    for (const a in this.accMap) {

      seq[a] = this.setSeqArray(this.accMap[a], this.maxSeqLength)
    }


    const uniprotPosition: any = {}

    const tempPosition: any = {}
    for (const n of this.positions["Uniprot"]) {
      if (this.form.value.modificationTypes.includes(n.modType)) {
        uniprotPosition[n.res] = true
      }
    }
    for (const u in this.positions) {
      if ((u !== "Uniprot")) {
        tempPosition[u] = {}
        for (const p of this.positions[u]) {
          tempPosition[u][p.res]= true
        }
      }
    }
    tempPosition["Uniprot"] = uniprotPosition
    console.log(tempPosition)
    const alignedPos: any[] =[]
    const annotations: any = {}
    for (const u in tempPosition) {
      z[u] = []
      annotations[u] = []
      barData[u] = {
        x: [],
        y: [],
        text: [],
        type: "bar",
        marker: {
          color: []
        },
        name: u
      }
      let emptyCount = 0
      for (let i = 0; i < seqLength; i++) {
        if (this.sequence[this.accMap[u]][i] === "-") {
          emptyCount = emptyCount + 1

          barData[u].y.push(1)
          barData[u].text.push("-")
          barData[u].marker.color.push('rgb(255,255,255)')
        } else {
          const currentPosition = i - emptyCount
          if (seq[u][i] !== "_") {
            let matchColor = 'rgba(172,238,227,0.3)'
            if (tempPosition[u][currentPosition]) {
              matchColor = 'rgba(176,6,0,'+this.opacityMap[currentPosition] + ')'
              if (u ==="Experimental Data") {
                alignedPos.push({
                  pos: i,
                  color: 'rgba(176,6,0,'+this.opacityMap[currentPosition] + ')',
                  annotation: {
                    xref: 'x',
                    yref: 'y',
                    x: seq[u][i],
                    y: 1.5,
                    text: "<b>"+currentPosition+"</b>",
                    showarrow: true,
                    arrowhead: 0.2,
                    font: {
                      size: 10,
                      color: 'rgb(171,0,88)'
                    }
                  }
                })
              }
              if (this.selectedPosition !== undefined) {
                if (currentPosition === this.selectedPosition) {
                  matchColor = 'rgba(78,222,38,0.8)'
                }
              }


              barData[u].y.push(2)
              barData[u].text.push(seq[u][i] + "(" + (currentPosition + 1) + ":Modified)")
              barData[u].marker.color.push(matchColor)
            } else {
              barData[u].y.push(1)
              barData[u].text.push(seq[u][i] + "(" + (currentPosition + 1) + ")")
              barData[u].marker.color.push('rgba(231,217,189,0.8)')
            }
          } else {
            barData[u].y.push(1)
            barData[u].text.push("_")
            barData[u].marker.color.push('rgba(252,250,247,0.8)')
          }
        }



      }
    }
    console.log(alignedPos)
    for (const i of alignedPos) {
      for (const u in tempPosition) {
        if (u !== "Experimental Data") {
          if (barData[u].y[i.pos] === 2) {
            barData[u].marker.color[i.pos] = i.color
          }
        }
        if (barData[u].y[i.pos] === 2) {
          annotations[u].push(i.annotation)
        }
      }
    }
    for (const u in z) {
      barData[u].x = seq[u]
    }

    this.graphData2 = barData
    console.log(z)
    for (const u in z) {
      let title = u
      if (this.dataService.databaseNameMap[u]) {
        title = this.dataService.databaseNameMap[u]
      }
      this.graphLayout2[u] = {
        title: title,
        xaxis: {
          showticklabels: false,
          type: 'category',
          tickmode: 'array',
          tickvals: seq,
          visible: false
        },
        yaxis: {
          showticklabels: false,
          range: [0,2],
          visible: false
        },
        height: this.titleOrder.length * 100,
        margin: {t: 25, b: 25, r: 200, l: 200},
      }
      switch (u) {
        case "Uniprot":
          this.graphLayout2[u].title = this.graphLayout2[u].title + " " + this.uniprotEntry
          break
        case "PSP_PHOSPHO":

          this.graphLayout2[u].title = this.graphLayout2[u].title + " " + this.dataService.dbIDMap["PSP_PHOSPHO"][this._data].selected
          break
        case "PLMD_UBI":

          this.graphLayout2[u].title = this.graphLayout2[u].title + " " + this.dataService.dbIDMap["PLMD_UBI"][this._data].selected
          break
        case "Experimental Data":
          this.graphLayout2[u].title = this.graphLayout2[u].title + " " + this._data
          break
        default:
          break
      }
      if (this.customRange.length > 0) {
        this.graphLayout2[u].xaxis.range = this.customRange
      }
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    if(this.observeChange) {
      this.observeChange.unsubscribe()
    }
  }

  changeBoundary(graphName: string, event: any) {


  }

  /*async updateBoundary(graphName: string, event: any) {
    if (graphName === "heatmap") {
      for (const c in this.graphLayout2) {
        if ((this.graphLayout2[c].xaxis.range[0] !== event["xaxis.range[0]"]) || (this.graphLayout2[c].xaxis.range[1] !== event["xaxis.range[1]"])) {
          this.graphLayout2[c].xaxis.range = [event["xaxis.range[0]"], event["xaxis.range[1]"]]
          const graph = this.plotly.getInstanceByDivId(this.uniprotEntry + c)
          const p = await this.plotly.getPlotly()
          await p.relayout(graph, {})
        }

      }
    } else {
      if ((this.graphLayout.xaxis.range[0] !== event["xaxis.range[0]"]) || (this.graphLayout.xaxis.range[1] !== event["xaxis.range[1]"])) {
        this.graphLayout.xaxis.range = [event["xaxis.range[0]"], event["xaxis.range[1]"]]
        const graph = this.plotly.getInstanceByDivId(this.uniprotEntry + "heatmap")
        const p = await this.plotly.getPlotly()
        await p.relayout(graph, {})
      }
      for (const c of this.titleOrder) {
        if (c !== graphName) {
          if ((this.graphLayout2[c].xaxis.range[0] !== event["xaxis.range[0]"]) || (this.graphLayout2[c].xaxis.range[1] !== event["xaxis.range[1]"])) {
            this.graphLayout2[c].xaxis.range = [event["xaxis.range[0]"], event["xaxis.range[1]"]]
            const graph = this.plotly.getInstanceByDivId(this.uniprotEntry + c)
            const p = await this.plotly.getPlotly()
            await p.relayout(graph, {})
          }
        }
      }
    }
  }*/
  updateBoundary(graphName: string, event: any) {
    this.customRange = [event["xaxis.range[0]"], event["xaxis.range[1]"]]
    this.draw()
  }

  draw() {
/*    if (this.dataService.pspIDMap[this._data]) {
      this.dataService.pspIDMap[this._data].selected = this.form.value["pspSelected"]
    }*/
    for (const s in this.sequence) {
      if (this.sequence[s].length > this.maxSeqLength) {
        this.maxSeqLength = this.sequence[s].length
      }
    }

    if (this.heatmapEnable) {
      this.drawHeatmap()
    } else {
      this.drawBarChart()
    }
  }

  async downloadPlot() {
    for (const g of this.titleOrder) {
      if (this.graphData2[g]) {
        await this.dataService.downloadPlotlyExtra(this.uniprotEntry+g, "svg")
      }
    }
  }
}

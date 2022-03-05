import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {UniprotService} from "../../../services/uniprot.service";
import {DataService} from "../../../services/data.service";
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";
import {PlotlyService} from "angular-plotly.js";
import {Observable, Subscription} from "rxjs";
import {SettingsService} from "../../../services/settings.service";
import {PspService} from "../../../services/psp.service";


@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css']
})
export class HeatmapComponent implements OnInit, OnDestroy {
  opacityMap: any = {}
  significant = {max: 0, min: 0}
  foldChange = {max: 0, min: 0}
  _data = ""
  titleOrder = ["uniprot", "Experimental Data", "PSP"]
  selectedUID: any[] = []
  df: IDataFrame = new DataFrame()
  form: FormGroup = this.fb.group({
    modificationTypes: [[
      "Phosphoserine",
      "Phosphothreonine",
      "Phosphotyrosine"
    ]]
  })
  customRange: any = []
  modTypes: string[] = []
  uniprotEntry: string = ""
  unidStack: any = {}
  selectedPosition: number|undefined
  observeChange: Subscription | undefined
  heatmapEnable: boolean = false
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
      this.sequence = d["Sequence"]
      this.uniprotEntry = d["Entry"]
      this.positions["uniprot"] = d["Modified residue"]
      if (this.psp.pspMap[this.uniprotEntry]) {
        this.positions["PSP"] = this.psp.pspMap[this.uniprotEntry]
      }

      const mods: string[] = []
      for (const m of this.positions["uniprot"]) {
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
        this.df = this.dataService.dataFile.data.where(row => row[this.dataService.cols.accessionCol] === this._data).bake()
        this.changeDF = this.dataService.dataFile.data.where(row => this.selectedUID.includes(row[this.dataService.cols.primaryIDComparisonCol])).bake()
        const sign = this.df.getSeries(this.dataService.cols.significantCol).bake()
        this.significant.max = sign.max()
        this.significant.min = sign.min()
        const fc = this.df.getSeries(this.dataService.cols.foldChangeCol).bake()
        this.foldChange.max = fc.max()
        this.foldChange.min = fc.min()
        this.positions["Experimental Data"] = []
        for (const p of this.df) {
          if (p[this.dataService.cols.score] >= this.settings.settings.probabilityFilterMap[this._data]) {
            const pos = p[this.dataService.cols.positionCol]
            this.opacityMap[pos] = (p[this.dataService.cols.foldChangeCol]-this.foldChange.min)/(this.foldChange.max - this.foldChange.min) * 0.75 +0.25
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
      if (this.heatmapEnable) {
        this.drawHeatmap()
      } else {
        this.drawBarChart()
      }

    }
  }

  queries: any[] = []
  changeDF: IDataFrame = new DataFrame()
  sequence = ``
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
    }
  }
  constructor(private psp: PspService, private uniprot: UniprotService, private dataService: DataService, private fb: FormBuilder, public plotly: PlotlyService, private settings: SettingsService) {
    this.dataService.selectionNotifier.subscribe(data => {
      if (data) {
        if (this.unidStack[this.dataService.justSelected]) {
          this.selectedPosition = this.unidStack[this.dataService.justSelected]
          if (this.heatmapEnable) {
            this.drawHeatmap()
          } else {
            this.drawBarChart()
          }
        }
      }
    })
  }

  drawHeatmap() {

    const seqLength = this.sequence.length
    const z: any = {}
    const seq: any[] = []
    const seqNames: string[] = []
    const barData: any = {}
    for (let i = 0; i < seqLength; i++) {
      seq.push(this.sequence[i] + "." + i)
    }

    const uniprotPosition: number[] = []
    const pspPosition: number[] = []

    const tempPosition: any = {}
    console.log(tempPosition)
    for (const n of this.positions["uniprot"]) {
      if (this.form.value.modificationTypes.includes(n.modType)) {
        uniprotPosition.push(n)
      }
    }
    for (const u in this.positions) {
      if ((u !== "uniprot")) {
        tempPosition[u] = this.positions[u]
      }
    }
    tempPosition["uniprot"] = uniprotPosition
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
      if (this.customRange.length > 0) {
        this.graphLayout2[u].xaxis.range = this.customRange
      }
    }

  }

  drawBarChart() {
    const seqLength = this.sequence.length
    const z: any = {}
    const seq: any[] = []
    const barData: any = {}
    for (let i = 0; i < seqLength; i++) {
      seq.push(this.sequence[i] + "." + i)
    }

    const uniprotPosition: any = {}

    const tempPosition: any = {}
    for (const n of this.positions["uniprot"]) {
      if (this.form.value.modificationTypes.includes(n.modType)) {
        uniprotPosition[n.res] = true
      }
    }
    for (const u in this.positions) {
      if ((u !== "uniprot")) {
        tempPosition[u] = {}
        for (const p of this.positions[u]) {
          tempPosition[u][p.res]= true
        }
      }
    }
    tempPosition["uniprot"] = uniprotPosition
    console.log(tempPosition)
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
      for (let i = 0; i < seqLength; i++) {
        let matchColor = 'rgba(84,38,222,0.8)'
        if (tempPosition[u][i]) {
          matchColor = 'rgba(222,45,38,'+this.opacityMap[i] + ')'
          if (this.selectedPosition !== undefined) {
            if (i === this.selectedPosition) {
              matchColor = 'rgba(78,222,38,0.8)'
            }
          }
          barData[u].y.push(2)
          barData[u].text.push(seq[i] + "(Modified)")
          barData[u].marker.color.push(matchColor)
        } else {
          barData[u].y.push(1)
          barData[u].text.push(seq[i])
          barData[u].marker.color.push('rgba(248,219,217,0.8)')
        }
      }
    }

    for (const u in z) {
      barData[u].x = seq
    }
    this.graphData2 = barData
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
        height: this.titleOrder.length * 100,
        margin: {t: 25, b: 25, r: 200, l: 200},
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
    if (this.heatmapEnable) {
      this.drawHeatmap()
    } else {
      this.drawBarChart()
    }

  }
}

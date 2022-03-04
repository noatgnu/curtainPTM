import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {UniprotService} from "../../../services/uniprot.service";
import {DataService} from "../../../services/data.service";
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormGroup} from "@angular/forms";
import {PlotlyService} from "angular-plotly.js";
import {waitForAsync} from "@angular/core/testing";
import {Observable, Subscription} from "rxjs";
import {SettingsService} from "../../../services/settings.service";
import {PspService} from "../../../services/psp.service";


@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.css']
})
export class HeatmapComponent implements OnInit, OnDestroy {
  _data = ""
  titleOrder = ["uniprot", "user-data", "PSP"]
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
  observeChange: Subscription | undefined
  @Input() set data(value: string)  {
    this._data = value
    console.log(this._data)
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

  private processData() {
    const d = this.uniprot.results.get(this._data)
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

        this.positions["user-data"] = []
        for (const p of this.df) {
          if (p[this.dataService.cols.score] >= this.settings.settings.probabilityFilterMap[this._data]) {
            const pos = parseInt(p[this.dataService.cols.positionCol]) - 1
            let ap = true
            for (const r of this.positions["user-data"]) {
              if (r.res === pos) {
                ap = false
              }
            }
            if (ap) {
              this.positions["user-data"].push({res: pos})
            }
          }
        }
      }
      this.drawHeatmap()
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

  }

  drawHeatmap() {

    const seqLength = this.sequence.length
    const z: any = {}
    const seq: any[] = []
    const seqNames: string[] = []
    const barData: any = {}
    for (let i = 0; i < seqLength; i++) {
      seq.push(this.sequence[i] + "." + (i+1))
    }

    const uniprotPosition: number[] = []
    const pspPosition: number[] = []

    const tempPosition: any = {}

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
        for (const p of tempPosition[u]) {
          if (start < p.res && end > p.res) {
            score += 1
          }
          if (p.res === i) {
            match = true
          }
        }
        if (match) {
          barData[u].y.push(2)
          barData[u].text.push(seq[i] + "(Modified)")
          barData[u].marker.color.push('rgba(222,45,38,0.8)')
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

    this.graphLayout.xaxis.tickvals = seq
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
        height: temp.y.length * 100,
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
    console.log(this.customRange)
    this.drawHeatmap()
  }
}

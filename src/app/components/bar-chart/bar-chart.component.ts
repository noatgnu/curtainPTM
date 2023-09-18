import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../data.service";
import {Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {PlotlyService} from "angular-plotly.js";
import {WebService} from "../../web.service";
import {StatsService} from "../../stats.service";
import {Settings} from "../../classes/settings";
import {SettingsService} from "../../settings.service";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss']
})
export class BarChartComponent implements OnInit {
  _data: any = {}
  uni: any = {}
  comparisons: any[] = []
  conditionA: string = ""
  conditionB: string = ""
  selectedConditions: string[] = []
  conditions: string[] = []
  testType: string = "ANOVA"
  iscollapsed: boolean = true
  config: any = {
    modeBarButtonsToRemove: ["toImage"]
  }


  barChartErrorType: string = "Standard Error"

  @Input() set data(value: any) {
    this._data = value.raw
    if (this._data[this.dataService.rawForm.primaryIDs]) {
      this.title = "<b>" + this._data[this.dataService.rawForm.primaryIDs] + "</b>"
      this.uni = this.uniprot.getUniprotFromAcc(this._data[this.dataService.rawForm.primaryIDs])

      if (this.uni["Gene Names"] !== "") {
        this.title = "<b>" + value.position.residue + value.position.position + " "+ this.uni["Gene Names"] + "(" + this._data[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
      }
      this.drawBarChart()
      this.graphLayout["title"] = this.title
      this.graphLayoutAverage["title"] = this.title
      this.graphLayoutViolin["title"] = this.title
      this.drawAverageBarChart()
    }
  }
  title = ""
  graph: any = {}
  graphData: any[] = []
  graphLayout: any = {
    width: 1100,
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    annotations: [],
    shapes: [],
    margin: {r: 50, l: 50, b: 100, t: 100},

  }

  graphDataAverage: any[] = []
  graphLayoutAverage: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    margin: {r: 40, l: 40, b: 120, t: 100}
  }

  graphDataViolin: any[] = []
  graphLayoutViolin: any = {
    xaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
      tickvals: [],
      ticktext: []
    },
    yaxis: {
      tickfont: {
        size: 17,
        color: "black",
      },
    },
    margin: {r: 40, l: 40, b: 120, t: 100}
  }
  constructor(private settings: SettingsService, private stats: StatsService, private web: WebService, public dataService: DataService, private uniprot: UniprotService) {
    this.dataService.finishedProcessingData.subscribe(data => {
      if (data) {

      }
    })
    this.dataService.redrawTrigger.subscribe(data => {
      if (data) {
        this.drawBarChart()
        this.drawAverageBarChart()
      }
    })
  }

  download(type: string) {
    this.web.downloadPlotlyImage('svg', type+'.svg', this._data[this.dataService.rawForm.primaryIDs]+type).then()
  }

  ngOnInit(): void {
  }
  drawBarChart() {
    const tickvals: string[] = []
    const ticktext: string[] = []
    const graph: any = {}

    this.graphData = []
    const annotations: any[] = []
    const shapes: any[] = []
    let sampleNumber: number = 0
    for (const s in this.settings.settings.sampleMap) {
      if (this.settings.settings.sampleVisible[s]) {
        sampleNumber ++
        const condition = this.settings.settings.sampleMap[s].condition
        let color = this.settings.settings.colorMap[condition]
        if (this.settings.settings.barchartColorMap[condition]) {
          color = this.settings.settings.barchartColorMap[condition]
        }
        if (!graph[condition]) {
          graph[condition] = {
            x: [],
            y: [],
            type: "bar",
            marker: {
              color: color
            },
            name: condition,
            showlegend: false
          }
        }
        graph[condition].x.push(s)
        graph[condition].y.push(this._data[s])
      }
    }
    let currentSampleNumber: number = 0
    for (const g in graph) {
      const annotationsPosition = currentSampleNumber +  graph[g].x.length/2
      currentSampleNumber = currentSampleNumber + graph[g].x.length
      this.graphData.push(graph[g])
      tickvals.push(graph[g].x[Math.round(graph[g].x.length/2)-1])
      ticktext.push(g)
      if (sampleNumber !== currentSampleNumber) {
        shapes.push({
          type: "line",
          xref: "paper",
          yref: "paper",
          x0: currentSampleNumber/sampleNumber,
          x1: currentSampleNumber/sampleNumber,
          y0: 0,
          y1: 1,
          line: {
            dash: "dash",
          }
        })
      }
    }
    //const combos = this.dataService.pairwise(this.dataService.conditions)
    //const comparisons = []
    // for (const c of combos) {
    //   const a = graph[c[0]]
    //   const b = graph[c[1]]
    //   comparisons.push({
    //     a: c[0], b: c[1], comparison: this.anova.calculateAnova(a.y, b.y)
    //   })
    // }
    this.graph = graph
    // this.comparisons = comparisons
    this.graphLayout.shapes = shapes

    this.graphLayout.xaxis.tickvals = tickvals
    this.graphLayout.xaxis.ticktext = ticktext
  }

  drawAverageBarChart() {
    const tickVals: string[] = []
    const tickText: string[] = []
    const graphData: any[] = []
    const graphViolin: any[] = []
    const graph: any = {}
    let sampleNumber: number = 0
    for (const s in this.settings.settings.sampleMap) {
      if (this.settings.settings.sampleVisible[s]) {
        sampleNumber ++
        const condition = this.settings.settings.sampleMap[s].condition
        if (!graph[condition]) {
          graph[condition] = []
        }
        graph[condition].push(this._data[s])
      }
    }
    for (const g in graph) {
      let color = this.settings.settings.colorMap[g]
      if (this.settings.settings.barchartColorMap[g]) {
        color = this.settings.settings.barchartColorMap[g]
      }
      const box = {
        x: g, y: graph[g].filter((a: number) => {
          return !isNaN(a)
        }),
        type: 'box',
        boxpoints: 'all',
        pointpos: 0,
        jitter: 0.3,
        fillcolor: 'rgba(255,255,255,0)',
        line: {
          color: 'rgba(255,255,255,0)',
        },
        hoveron: 'points',
        marker: {
          color: "#654949",
          opacity: 0.8,
        },
        name: g,
        //visible: visible,
        showlegend: false
      }
      const violinX: any[] = graph[g].map(() => g)
      const violin = {
        type: 'violin',
        x: violinX, y: graph[g].filter((a: number) => {
          return !isNaN(a)
        }), points: "all",
        box: {
          visible: true
        },
        meanline: {
          visible: true
        },
        line: {
          color: "black"
        },
        fillcolor: color,
        name: g,
        showlegend: false,
        spanmode: 'soft'
      }
      graphViolin.push(violin)
      const s = new Series(graph[g].filter((a: number) => {
        return !isNaN(a)
      }))
      const std =  s.std()
      const standardError = std/Math.sqrt(s.count())
      let error = std
      switch (this.barChartErrorType) {
        case "Standard Error":
          error = standardError
          break
        default:
          break
      }
      const mean = s.mean()
      graphData.push({
        x: [g], y: [mean],
        type: 'bar',
        mode: 'markers',
        error_y: {
          type: 'data',
          array: [error],
          visible: true
        },
        marker: {
          color: color
        },
        //visible: temp[t].visible,
        showlegend: false
      })
      graphData.push(box)
      tickVals.push(g)
      tickText.push(g)
    }
    this.graphDataAverage = graphData
    this.graphLayoutAverage.xaxis.tickvals = tickVals
    this.graphLayoutAverage.xaxis.ticktext = tickText
    this.graphLayoutViolin.xaxis.tickvals = tickVals
    this.graphLayoutViolin.xaxis.ticktext = tickText
    this.graphDataViolin = graphViolin
  }

  performTest() {
    //const a = this.graph[this.conditionA]
    //const b = this.graph[this.conditionB]

    const conditions = this.selectedConditions.map(a => this.graph[a].y)
    console.log(conditions)
    switch (this.testType) {
      case "ANOVA":
        this.comparisons = [{conditions: this.selectedConditions.slice(), comparison: this.stats.calculateAnova2(conditions)}]
        console.log(this.comparisons)
        break
      case "TTest":
        this.stats.calculateTTest(this.graph[this.conditionA].y, this.graph[this.conditionB].y).then((result: any) => {
          this.selectedConditions = [this.conditionA, this.conditionB]
          this.comparisons = [{conditions: this.selectedConditions.slice(), comparison: result.data}]
          console.log(this.comparisons)
        })
        //console.log(this.stats.calculateTTest(a.y, b.y))
        //this.comparisons = [{a: this.conditionA, b: this.conditionB, comparison: this.stats.calculateTTest(a.y, b.y)}]
        break
    }
  }
}

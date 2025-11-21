import {Component, computed, DestroyRef, effect, inject, input, OnInit, signal} from '@angular/core';
import {DataService} from "../../data.service";
import {Series} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {WebService} from "../../web.service";
import {StatsService} from "../../stats.service";
import {SettingsService} from "../../settings.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    standalone: false
})
export class BarChartComponent implements OnInit {
  private destroyRef = inject(DestroyRef)

  data = input<any>()

  _data = signal<any>({})
  currentPrimaryID = signal<string>("")
  title = signal<string>("")

  uni: any = {}
  comparisons: any[] = []
  conditionA: string = ""
  conditionB: string = ""
  selectedConditions: string[] = []
  conditions: string[] = []
  testType: string = "ANOVA"
  iscollapsed: boolean = true
  isYAxisCollapsed: boolean = true
  config: any = {
    modeBarButtonsToRemove: ["toImage"]
  }

  barChartErrorType: string = "Standard Error"

  constructor(
    public settings: SettingsService,
    private stats: StatsService,
    private web: WebService,
    public dataService: DataService,
    private uniprot: UniprotService
  ) {
    effect(() => {
      const value = this.data()
      if (value) {
        this._data.set(value.raw)
        const rawData = value.raw
        if (rawData[this.dataService.rawForm.primaryIDs]) {
          this.currentPrimaryID.set(rawData[this.dataService.rawForm.primaryIDs])
          let newTitle = "<b>" + this.currentPrimaryID() + "</b>"
          if (this.dataService.fetchUniProt) {
            this.uni = this.uniprot.getUniprotFromAcc(rawData[this.dataService.rawForm.primaryIDs])
            if (this.uni["Gene Names"] !== "") {
              newTitle = "<b>" + value.position.residue + value.position.position + " " + this.uni["Gene Names"] + "(" + rawData[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
            }
          } else {
            if (this.dataService.differentialForm.geneNames !== "") {
              const result = this.dataService.currentDF.where(row => (row[this.dataService.differentialForm.primaryIDs] === rawData[this.dataService.rawForm.primaryIDs])).toArray()
              if (result.length > 0) {
                const diffData = result[0]
                newTitle = "<b>" + value.position.residue + value.position.position + " " + diffData[this.dataService.differentialForm.geneNames] + "(" + rawData[this.dataService.rawForm.primaryIDs] + ")" + "</b>"
              }
            } else {
              newTitle = "<b>" + rawData[this.dataService.rawForm.primaryIDs] + "</b>"
            }
          }
          this.title.set(newTitle)
          this.drawBarChart()
          this.graphLayout["title"] = this.title()
          this.graphLayoutAverage["title"] = this.title()
          this.graphLayoutViolin["title"] = this.title()
          this.drawAverageBarChart()
        }
      }
    })

    this.dataService.redrawTrigger.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      if (data) {
        this.drawBarChart()
        this.drawAverageBarChart()
      }
    })
  }
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
    margin: {r: 50, l: 100, b: 100, t: 100},

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
    margin: {r: 40, l: 100, b: 120, t: 100}
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
    margin: {r: 40, l: 100, b: 120, t: 100}
  }

  download(type: string) {
    this.web.downloadPlotlyImage('svg', type+'.svg', this._data()[this.dataService.rawForm.primaryIDs]+type).then()
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
        graph[condition].y.push(this._data()[s])
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
    if (this.settings.settings.columnSize.barChart !== 0) {
      this.graphLayout.width = this.graphLayout.margin.l + this.graphLayout.margin.r + this.settings.settings.columnSize.barChart * sampleNumber
    }
    this.graphLayout.xaxis.tickvals = tickvals
    this.graphLayout.xaxis.ticktext = ticktext

    this.applyYAxisLimits('barChart', this.graphLayout)
  }

  setIndividualLimit(chartType: string, limitType: 'min' | 'max', value: any) {
    const primaryID = this.currentPrimaryID()
    if (!this.settings.settings.individualYAxisLimits[primaryID]) {
      this.settings.settings.individualYAxisLimits[primaryID] = {}
    }
    if (!this.settings.settings.individualYAxisLimits[primaryID][chartType]) {
      this.settings.settings.individualYAxisLimits[primaryID][chartType] = { min: null, max: null }
    }
    this.settings.settings.individualYAxisLimits[primaryID][chartType][limitType] = value === '' ? null : Number(value)
    this.drawBarChart()
    this.drawAverageBarChart()
  }

  clearIndividualLimits() {
    delete this.settings.settings.individualYAxisLimits[this.currentPrimaryID()]
    this.drawBarChart()
    this.drawAverageBarChart()
  }

  applyYAxisLimits(chartType: string, layout: any) {
    const globalLimits = this.settings.settings.chartYAxisLimits?.[chartType]
    const individualLimits = this.settings.settings.individualYAxisLimits?.[this.currentPrimaryID()]?.[chartType]

    let minY = null
    let maxY = null

    if (globalLimits) {
      if (globalLimits.min !== null) minY = globalLimits.min
      if (globalLimits.max !== null) maxY = globalLimits.max
    }

    if (individualLimits) {
      if (individualLimits.min !== null) minY = individualLimits.min
      if (individualLimits.max !== null) maxY = individualLimits.max
    }

    if (minY !== null || maxY !== null) {
      layout.yaxis.range = [minY ?? 0, maxY ?? layout.yaxis.range?.[1] ?? 0]
      layout.yaxis.autorange = false
    } else {
      layout.yaxis.autorange = true
      delete layout.yaxis.range
    }
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
        graph[condition].push(this._data()[s])
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
        pointpos: this.settings.settings.violinPointPos,
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
    if (this.settings.settings.columnSize.averageBarChart !== 0) {
      this.graphLayoutAverage.width = this.graphLayoutAverage.margin.l + this.graphLayoutAverage.margin.r + this.settings.settings.columnSize.averageBarChart * tickVals.length
    }
    this.graphLayoutAverage.xaxis.tickvals = tickVals
    this.graphLayoutAverage.xaxis.ticktext = tickText
    if (this.settings.settings.columnSize.violinPlot !== 0) {
      this.graphLayoutViolin.width = this.graphLayoutViolin.margin.l + this.graphLayoutViolin.margin.r + this.settings.settings.columnSize.violinPlot * tickVals.length
    }
    this.graphLayoutViolin.xaxis.tickvals = tickVals
    this.graphLayoutViolin.xaxis.ticktext = tickText
    this.graphDataViolin = graphViolin

    this.applyYAxisLimits('averageBarChart', this.graphLayoutAverage)
    this.applyYAxisLimits('violinPlot', this.graphLayoutViolin)
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

  downloadData() {
    const rawData = this._data()
    let data: string = ""
    data = Object.keys(rawData).join("\t") + "\n"
    data = data + Object.values(rawData).join("\t") + "\n"
    this.web.downloadFile(this.title() + ".txt", data)
  }
}

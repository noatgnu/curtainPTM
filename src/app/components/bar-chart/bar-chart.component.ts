import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../../services/data.service";
import {DataFrame, IDataFrame, Series} from "data-forge";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  _data = ""
  cols: string[] = []
  df: IDataFrame = new DataFrame()

  _average: boolean = false
  @Input() set average(average: boolean) {
    this._average = average
    if (this._average) {
      this.drawAverage()
    }
  }

  @Input() set data(value: string) {
    this._data = value
    this.cols = this.dataService.cols.rawValueCols
    this.df = this.dataService.rawDataFile.data.where(row => row[this.dataService.cols.primaryIDRawCol] === this._data).bake()
    this.drawBarChart()
  }
  graphData: any[] = []
  graphLayout: any = {
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
    }
  }
  graphData2: any[] = []
  graphLayout2: any = {
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
    }
  }
  constructor(private dataService: DataService) { }

  ngOnInit(): void {
  }

  drawBarChart() {
    const tickvals: string[] = []
    const ticktext: string[] = []
    const graph: any = {}

    this.graphData = []
    const r = this.df.first()
    for (const c of this.cols) {
      const g = this.dataService._conditionMap[c]
      if (g) {
        if (!(g[0] in graph)) {
          graph[g[0]] =
          {
            x: [],
            y: [],
            type: "bar",
            name: g[0]
          }
        }
        graph[g[0]].x.push(c)
        graph[g[0]].y.push(r[c])
      }
    }
    for (const g in graph) {
      this.graphData.push(graph[g])
      tickvals.push(graph[g].x[Math.round(graph[g].x.length/2)-1])
      ticktext.push(g)
    }
    this.graphLayout.xaxis.tickvals = tickvals
    this.graphLayout.xaxis.ticktext = ticktext
  }

  drawAverage() {
    this.graphData2 = []
    this.graphLayout2.xaxis.ticktext = []
    this.graphLayout2.xaxis.tickvals = []
    const r = this.df.first()
    const temp: any = {}
    for (const c of this.cols) {
      const g = this.dataService._conditionMap[c]
      if (!temp[g[0]]) {
        temp[g[0]] = []
      }
      temp[g[0]].push(r[c])

    }

    for (const t in temp ) {
      const box = {
        x: t, y: temp[t],
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
        name: t,
          //visible: visible,
          showlegend: false
      }

      const s = new Series(temp[t])
      const std =  s.std()
      const standardError = std/Math.sqrt(s.count())
      const mean = s.mean()
      this.graphData2.push({
        x: [t], y: [mean],
        type: 'bar',
        mode: 'markers',
        error_y: {
          type: 'data',
          array: [standardError],
          visible: true
        },
        //visible: temp[t].visible,
        showlegend: false
      })
      this.graphData2.push(box)
      this.graphLayout2.xaxis.tickvals.push(t)
      this.graphLayout2.xaxis.ticktext.push(t)
    }
  }
}

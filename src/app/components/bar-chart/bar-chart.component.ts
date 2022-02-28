import {Component, Input, OnInit} from '@angular/core';
import {DataService} from "../../../services/data.service";
import {DataFrame, IDataFrame} from "data-forge";

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit {
  _data = ""
  cols: string[] = []
  df: IDataFrame = new DataFrame()

  @Input() set data(value: string) {
    this._data = value
    this.cols = this.dataService.cols.rawValueCols
    this.df = this.dataService.rawDataFile.data.where(row => row[this.dataService.cols.primaryIDRawCol] === this._data).bake()
    this.drawBarChart()
  }
  graphData: any[] = []
  graphLayout: any = {
    xaxis: {
      tickvals: [],
      ticktext: []
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
}

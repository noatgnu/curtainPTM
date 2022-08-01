import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as cytoscape from "cytoscape";
@Component({
  selector: 'app-cytoplot',
  templateUrl: './cytoplot.component.html',
  styleUrls: ['./cytoplot.component.scss']
})
export class CytoplotComponent implements OnInit, AfterViewInit {
  @Output() clickedID = new EventEmitter<string>()
  cy: any
  componentID: string = "cy"
  get drawData(): any {
    return this._drawData
  }

  _drawData: any = {}
  @Input() set drawData(value: any) {
    this._drawData = value
    if(this._drawData) {
      if (this._drawData.data.length > 2) {
        this.componentID = this._drawData.id
        setTimeout(() => {
          this.draw()
        }, 3000)
      }
    }

  }
  constructor() { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
  }

  draw() {
    console.log(this._drawData)
    const container = document.getElementById(this._drawData.id)
    console.log(container)
    this.cy = cytoscape(
      {
        container: container,
        elements: this.drawData.data,
        style: this.drawData.stylesheet
      }
    )

    const ad = this

    this.cy.layout({name: "cose", maxSimulationTime: 10000}).run()
    for (const n of this.cy.nodes()) {
      n.bind("click", function (event:any) {
        ad.clickedID.emit(event.target.id())
      })
    }
    for (const n of this.cy.edges()) {
      n.bind("click", function (event:any) {
        ad.clickedID.emit(event.target.id())
      })
    }
    console.log(this.cy)
  }
}

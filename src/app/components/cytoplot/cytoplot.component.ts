import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as cytoscape from "cytoscape";
import * as fcose from "cytoscape-fcose";
//import * as cxtmenu from "cytoscape-cxtmenu";



// @ts-ignore
//import * as cytoscapeSVG from "cytoscape-svg";
// @ts-ignore
//import * as panzoom from "cytoscape-panzoom";
import {SettingsService} from "../../settings.service";

//cytoscape.use(cytoscapeSVG);
cytoscape.use(fcose);
//cytoscape.use(cxtmenu);
@Component({
  selector: 'app-cytoplot',
  templateUrl: './cytoplot.component.html',
  styleUrls: ['./cytoplot.component.scss']
})
export class CytoplotComponent implements OnInit, AfterViewInit {
  private _dimensions = {width: 700, height: 700}
  @Output() clickedID = new EventEmitter<string>()
  @Output() ready = new EventEmitter<boolean>()
  @Input() set dimensions(value: any) {
    this._dimensions = value
  }
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

  constructor(private settings: SettingsService) { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
  }

  draw() {
    console.log(this._drawData)
    const container = document.getElementById(this._drawData.id)
    container?.style.setProperty("width", this._dimensions.width+"px")
    container?.style.setProperty("height", this._dimensions.height+"px")
    console.log(container)
    const ad = this
    if (!this.cy) {
      this.cy = cytoscape(
        {
          container: container,
          elements: this._drawData.data,
          style: this._drawData.stylesheet,
          wheelSensitivity: 0.1,
          hideEdgesOnViewport: true,
          hideLabelsOnViewport: true,
          pixelRatio: 1,
          textureOnViewport: true,
        }
      )
      if (this._drawData.fromBase) {
        this.cy.layout({name: "preset"}).run()
      } else {
        //this.cy.layout({name: "cose", maxSimulationTime: 10000}).run()
        this.cy.layout({name: "fcose", animationDuraction: 0}).run()
      }
/*      let defaults = {
        menuRadius: function(ele:any){ return 100; }, // the outer radius (node center to the end of the menu) in pixels. It is added to the rendered size of the node. Can either be a number or function as in the example.
        selector: 'node', // elements matching this Cytoscape.js selector will trigger cxtmenus
        commands: [ // an array of commands to list in the menu or a function that returns the array
          /!*
          { // example command
            fillColor: 'rgba(200, 200, 200, 0.75)', // optional: custom background color for item
            content: 'a command name', // html/text content to be displayed in the menu
            contentStyle: {}, // css key:value pairs to set the command's css in js if you want
            select: function(ele){ // a function to execute when the command is selected
              console.log( ele.id() ) // `ele` holds the reference to the active element
            },
            hover: function(ele){ // a function to execute when the command is hovered
              console.log( ele.id() ) // `ele` holds the reference to the active element
            },
            enabled: true // whether the command is selectable
          }
          *!/
        ], // function( ele ){ return [ /!*...*!/ ] }, // a function that returns commands or a promise of commands
        fillColor: 'rgba(0, 0, 0, 0.75)', // the background colour of the menu
        activeFillColor: 'rgba(1, 105, 217, 0.75)', // the colour used to indicate the selected command
        activePadding: 20, // additional size in pixels for the active command
        indicatorSize: 24, // the size in pixels of the pointer to the active command, will default to the node size if the node size is smaller than the indicator size,
        separatorWidth: 3, // the empty spacing in pixels between successive commands
        spotlightPadding: 4, // extra spacing in pixels between the element and the spotlight
        adaptativeNodeSpotlightRadius: false, // specify whether the spotlight radius should adapt to the node size
        minSpotlightRadius: 24, // the minimum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
        maxSpotlightRadius: 38, // the maximum radius in pixels of the spotlight (ignored for the node if adaptativeNodeSpotlightRadius is enabled but still used for the edge & background)
        openMenuEvents: 'cxttapstart taphold', // space-separated cytoscape events that will open the menu; only `cxttapstart` and/or `taphold` work here
        itemColor: 'white', // the colour of text in the command's content
        itemTextShadowColor: 'transparent', // the text shadow colour of the command's content
        zIndex: 9999, // the z-index of the ui div
        atMouse: false, // draw menu at mouse position
        outsideMenuCancel: false // if set to a number, this will cancel the command if the pointer is released outside of the spotlight, padded by the number given
      };

      let menu = this.cy.cxtmenu( defaults );*/
      this.cy.ready(() => {
        ad.ready.emit(true)
      })
    } else {
      if (this._drawData.remove.length > 0) {
        const removeIDs = this._drawData.remove.map((n: any) => n.data.id)
        const removeSelectNodes = this.cy.nodes().filter((n: any) => removeIDs.includes(n.id()))
        const removeSelectEdges = this.cy.edges().filter((n: any) => removeIDs.includes(n.id()))
        const removeCombined = [...removeSelectNodes].concat(...removeSelectEdges)
        for (const r of removeCombined) {
          this.cy.remove(r)
        }
      }
      if (this._drawData.add.length > 0) {
        const newNodes = this.cy.add(this._drawData.add)
        newNodes.layout({name: "fcose"}).run()
      }

      this.cy.style().clear().fromJson(this._drawData.stylesheet).update()
    }


    for (const n of this.cy.edges()) {
      n.bind("click", function (event:any) {
        ad.clickedID.emit(event.target.id())
      })
    }
  }

  download() {
/*    const svgContent = this.cy.svg({full:true})
    console.log(svgContent)
    const blob = new Blob([svgContent], {type:"image/svg+xml;charset=utf-8"});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a")
    a.href = url
    a.download = "cytoplot.svg"
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url)*/
  }

  saveJSON() {
    return this.cy.elements().jsons()
  }
}

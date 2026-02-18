import {AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import {SettingsService} from "../../settings.service";
import {ThemeService} from "../../theme.service";
import {Subscription} from "rxjs";

cytoscape.use(fcose);

@Component({
    selector: 'app-cytoplot',
    templateUrl: './cytoplot.component.html',
    styleUrls: ['./cytoplot.component.scss'],
    standalone: false
})
export class CytoplotComponent implements OnInit, AfterViewInit, OnDestroy {
  private themeSubscription?: Subscription;
  private _dimensions = {width: 700, height: 700}
  @Output() clickedID = new EventEmitter<string>()
  @Output() ready = new EventEmitter<boolean>()
  @Input() set dimensions(value: any) {
    this._dimensions = value
  }
  cy: any
  componentID: string = "cy"
  hidden = false;

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

  constructor(private settings: SettingsService, private themeService: ThemeService) { }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.beforeThemeChange$.subscribe(() => {
      this.hidden = true;
      if (this.cy) {
        this.cy.destroy();
        this.cy = null;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.cy) {
      this.cy.destroy();
      this.cy = null;
    }
  }

  ngAfterViewInit() {
  }

  updateStyles(styles: any[]): void {
    if (!this.cy) return;
    this.cy.style().clear().fromJson(styles).update();
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

  download(format: 'png' | 'svg' = 'png') {
    if (!this.cy) return;

    const bgColor = this.themeService.isDarkMode() ? "#212529" : "#FFFFFF";

    if (format === 'svg') {
      const svgContent = this.generateSVG(bgColor);
      const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "network.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      const pngContent = this.cy.png({ full: true, scale: 10, bg: bgColor, output: "blob" });
      const url = window.URL.createObjectURL(pngContent);
      const a = document.createElement("a");
      a.href = url;
      a.download = "network.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }

  private generateSVG(bgColor: string): string {
    const padding = 50;
    const bb = this.cy.elements().boundingBox();
    const width = bb.w + padding * 2;
    const height = bb.h + padding * 2;
    const offsetX = -bb.x1 + padding;
    const offsetY = -bb.y1 + padding;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <style type="text/css"><![CDATA[
      .node-label { dominant-baseline: central; text-anchor: middle; }
    ]]></style>
  </defs>
  <rect width="100%" height="100%" fill="${bgColor}"/>
  <g transform="translate(${offsetX}, ${offsetY})">`;

    svg += this.generateEdgesSVG();
    svg += this.generateNodesSVG();

    svg += `
  </g>
</svg>`;

    return svg;
  }

  private generateEdgesSVG(): string {
    let edgesSvg = '\n    <!-- Edges -->\n    <g class="edges">';

    this.cy.edges().forEach((edge: any) => {
      const display = edge.style('display');
      if (display === 'none') return;

      const sourcePos = edge.source().position();
      const targetPos = edge.target().position();
      const lineColor = edge.style('line-color');
      const lineWidth = parseFloat(edge.style('width')) || 1;
      const lineStyle = edge.style('line-style');
      const opacity = parseFloat(edge.style('opacity')) || 1;
      const curveStyle = edge.style('curve-style');

      let strokeDasharray = '';
      if (lineStyle === 'dashed') {
        strokeDasharray = `stroke-dasharray="${lineWidth * 3} ${lineWidth * 2}"`;
      } else if (lineStyle === 'dotted') {
        strokeDasharray = `stroke-dasharray="${lineWidth} ${lineWidth}"`;
      }

      if (curveStyle === 'bezier' || curveStyle === 'unbundled-bezier') {
        const ctrlPts = edge.controlPoints();
        if (ctrlPts && ctrlPts.length > 0) {
          let pathD = `M ${sourcePos.x} ${sourcePos.y}`;
          if (ctrlPts.length === 1) {
            pathD += ` Q ${ctrlPts[0].x} ${ctrlPts[0].y} ${targetPos.x} ${targetPos.y}`;
          } else if (ctrlPts.length >= 2) {
            pathD += ` C ${ctrlPts[0].x} ${ctrlPts[0].y} ${ctrlPts[1].x} ${ctrlPts[1].y} ${targetPos.x} ${targetPos.y}`;
          }
          edgesSvg += `
      <path d="${pathD}" fill="none" stroke="${lineColor}" stroke-width="${lineWidth}"
        opacity="${opacity}" ${strokeDasharray}/>`;
        } else {
          edgesSvg += `
      <line x1="${sourcePos.x}" y1="${sourcePos.y}" x2="${targetPos.x}" y2="${targetPos.y}"
        stroke="${lineColor}" stroke-width="${lineWidth}" opacity="${opacity}" ${strokeDasharray}/>`;
        }
      } else {
        edgesSvg += `
      <line x1="${sourcePos.x}" y1="${sourcePos.y}" x2="${targetPos.x}" y2="${targetPos.y}"
        stroke="${lineColor}" stroke-width="${lineWidth}" opacity="${opacity}" ${strokeDasharray}/>`;
      }
    });

    edgesSvg += '\n    </g>';
    return edgesSvg;
  }

  private generateNodesSVG(): string {
    let nodesSvg = '\n    <!-- Nodes -->\n    <g class="nodes">';

    this.cy.nodes().forEach((node: any) => {
      const display = node.style('display');
      if (display === 'none') return;

      const pos = node.position();
      const bgColor = node.style('background-color');
      const borderColor = node.style('border-color');
      const borderWidth = parseFloat(node.style('border-width')) || 0;
      const nodeWidth = parseFloat(node.style('width')) || 20;
      const nodeHeight = parseFloat(node.style('height')) || 20;
      const opacity = parseFloat(node.style('opacity')) || 1;
      const shape = node.style('shape');

      const label = node.data('label') || node.style('label') || '';
      const fontSize = parseFloat(node.style('font-size')) || 10;
      const fontFamily = node.style('font-family') || 'Arial, Helvetica, sans-serif';
      const textColor = node.style('color') || '#000000';
      const textOutlineColor = node.style('text-outline-color');
      const textOutlineWidth = parseFloat(node.style('text-outline-width')) || 0;

      nodesSvg += `
      <g class="node" data-id="${this.escapeXml(node.id())}" transform="translate(${pos.x}, ${pos.y})">`;

      const rx = nodeWidth / 2;
      const ry = nodeHeight / 2;

      switch (shape) {
        case 'rectangle':
        case 'roundrectangle':
          const cornerRadius = shape === 'roundrectangle' ? Math.min(rx, ry) * 0.3 : 0;
          nodesSvg += `
        <rect x="${-rx}" y="${-ry}" width="${nodeWidth}" height="${nodeHeight}" rx="${cornerRadius}" ry="${cornerRadius}"
          fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}" opacity="${opacity}"/>`;
          break;
        case 'triangle':
          const triPoints = `0,${-ry} ${rx},${ry} ${-rx},${ry}`;
          nodesSvg += `
        <polygon points="${triPoints}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}" opacity="${opacity}"/>`;
          break;
        case 'diamond':
          const diaPoints = `0,${-ry} ${rx},0 0,${ry} ${-rx},0`;
          nodesSvg += `
        <polygon points="${diaPoints}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}" opacity="${opacity}"/>`;
          break;
        case 'hexagon':
          const hexW = rx * 0.866;
          const hexH = ry * 0.5;
          const hexPoints = `${hexW},${-hexH} ${hexW},${hexH} 0,${ry} ${-hexW},${hexH} ${-hexW},${-hexH} 0,${-ry}`;
          nodesSvg += `
        <polygon points="${hexPoints}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}" opacity="${opacity}"/>`;
          break;
        case 'star':
          nodesSvg += this.generateStarPath(rx, ry, bgColor, borderColor, borderWidth, opacity);
          break;
        default:
          nodesSvg += `
        <ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="${bgColor}" stroke="${borderColor}" stroke-width="${borderWidth}" opacity="${opacity}"/>`;
      }

      if (label) {
        const escapedLabel = this.escapeXml(label);

        if (textOutlineWidth > 0) {
          nodesSvg += `
        <text class="node-label" x="0" y="0" font-family="${fontFamily}" font-size="${fontSize}px"
          fill="${textOutlineColor}" stroke="${textOutlineColor}" stroke-width="${textOutlineWidth * 2}px" stroke-linejoin="round">${escapedLabel}</text>`;
        }

        nodesSvg += `
        <text class="node-label" x="0" y="0" font-family="${fontFamily}" font-size="${fontSize}px" fill="${textColor}">${escapedLabel}</text>`;
      }

      nodesSvg += `
      </g>`;
    });

    nodesSvg += '\n    </g>';
    return nodesSvg;
  }

  private generateStarPath(rx: number, ry: number, fill: string, stroke: string, strokeWidth: number, opacity: number): string {
    const points = 5;
    const outerR = Math.min(rx, ry);
    const innerR = outerR * 0.4;
    let pathD = '';

    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      pathD += (i === 0 ? 'M' : 'L') + ` ${x} ${y} `;
    }
    pathD += 'Z';

    return `
        <path d="${pathD}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  saveJSON() {
    return this.cy.elements().jsons()
  }

  highlightNodes(nodeIds: string[]): void {
    if (!this.cy) return;
    this.cy.nodes().removeClass('highlighted');
    for (const id of nodeIds) {
      const node = this.cy.getElementById(id);
      if (node) {
        node.addClass('highlighted');
      }
    }
  }

  clearHighlights(): void {
    if (!this.cy) return;
    this.cy.nodes().removeClass('highlighted');
  }

  filterEdges(source: 'all' | 'stringdb' | 'interactome'): void {
    if (!this.cy) return;

    this.cy.edges().removeClass('hidden');

    if (source === 'stringdb') {
      this.cy.edges('.interactome').addClass('hidden');
    } else if (source === 'interactome') {
      this.cy.edges('.stringdb').addClass('hidden');
    }
  }

  runLayout(layoutType: string): void {
    if (!this.cy) return;

    const layoutOptions: any = {
      name: layoutType,
      animate: true,
      animationDuration: 500
    };

    if (layoutType === 'fcose' || layoutType === 'cose') {
      layoutOptions.name = 'fcose';
    }

    this.cy.layout(layoutOptions).run();
  }

  fit(): void {
    if (!this.cy) return;
    this.cy.fit();
  }

  zoomIn(): void {
    if (!this.cy) return;
    this.cy.zoom(this.cy.zoom() * 1.2);
  }

  zoomOut(): void {
    if (!this.cy) return;
    this.cy.zoom(this.cy.zoom() / 1.2);
  }

  handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.cy) return

    const panAmount = 50
    const zoomFactor = 1.1

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        this.cy.panBy({x: 0, y: panAmount})
        break
      case 'ArrowDown':
        event.preventDefault()
        this.cy.panBy({x: 0, y: -panAmount})
        break
      case 'ArrowLeft':
        event.preventDefault()
        this.cy.panBy({x: panAmount, y: 0})
        break
      case 'ArrowRight':
        event.preventDefault()
        this.cy.panBy({x: -panAmount, y: 0})
        break
      case '+':
      case '=':
        event.preventDefault()
        this.cy.zoom(this.cy.zoom() * zoomFactor)
        break
      case '-':
        event.preventDefault()
        this.cy.zoom(this.cy.zoom() / zoomFactor)
        break
      case 'Home':
        event.preventDefault()
        this.cy.fit()
        this.announceStatus('Graph view reset to fit all elements')
        break
      case '0':
        event.preventDefault()
        this.cy.zoom(1)
        this.cy.center()
        this.announceStatus('Graph view reset to default zoom')
        break
    }
  }

  private announceStatus(message: string): void {
    const statusEl = document.getElementById(this.componentID + '-status')
    if (statusEl) {
      statusEl.textContent = message
    }
  }
}

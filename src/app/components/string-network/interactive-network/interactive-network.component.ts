import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

export interface InteractiveSVGNode {
  stringId: string;
  preferredName: string;
  ncbiTaxonId: number;
  taxonName: string;
  annotation: string;
  x: number;
  y: number;
  ix: number;
  iy: number;
  radius: number;
  links: InteractiveSVGLink[];
  elm?: any;
}

export interface InteractiveSVGLink {
  n1: InteractiveSVGNode;
  n2: InteractiveSVGNode;
  elm: any;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export interface NetworkColorMap {
  [key: string]: string;
}

export interface NodeClickEvent {
  nodeId: string;
  nodeName: string;
  event: MouseEvent;
}

export interface EdgeClickEvent {
  node1: string;
  node2: string;
  event: MouseEvent;
}

@Component({
  selector: 'app-interactive-network',
  templateUrl: './interactive-network.component.html',
  styleUrl: './interactive-network.component.scss',
  standalone: false
})
export class InteractiveNetworkComponent implements AfterViewInit, OnDestroy {
  @ViewChild('networkContainer', { static: false }) networkContainer!: ElementRef<HTMLElement>;

  @Input() svgContent: string = '';
  @Input() selectedGenes: string[] = [];
  @Input() increaseGenes: string[] = [];
  @Input() decreaseGenes: string[] = [];
  @Input() allGenes: string[] = [];
  @Input() colorMap: NetworkColorMap = {
    'Increase': '#ff0000',
    'Decrease': '#0000ff',
    'In dataset': '#000000',
    'Not in dataset': '#999999'
  };

  @Output() nodeClick = new EventEmitter<NodeClickEvent>();
  @Output() edgeClick = new EventEmitter<EdgeClickEvent>();
  @Output() positionsChanged = new EventEmitter<{ [nodeId: string]: { x: number; y: number } }>();

  private readonly DEFAULT_SVG_WIDTH = 450;
  private readonly DEFAULT_SVG_HEIGHT = 450;
  private svgWidth = this.DEFAULT_SVG_WIDTH;
  private svgHeight = this.DEFAULT_SVG_HEIGHT;
  private svgMetainfoNodes: { [key: string]: InteractiveSVGNode } = {};
  private networkPositionsDirty = false;
  private destroy$ = new Subject<void>();

  ngAfterViewInit(): void {
    if (this.svgContent && this.networkContainer) {
      setTimeout(() => {
        this.initializeNetwork();
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeNetwork(): void {
    const containerElement = this.networkContainer.nativeElement;
    containerElement.innerHTML = this.svgContent;

    const networkDocument = containerElement.ownerDocument;
    if (!networkDocument) return;

    const svgElement = containerElement.querySelector('#svg_network_image') as SVGElement;
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    this.svgWidth = rect.width || this.DEFAULT_SVG_WIDTH;
    this.svgHeight = rect.height || this.DEFAULT_SVG_HEIGHT;

    this.svgMetainfoNodes = {};

    const nodeWrappers = containerElement.querySelectorAll('.nwnodecontainer');
    nodeWrappers.forEach((elm: any) => {
      const nodeId = elm.id;
      const texts = elm.getElementsByTagName('text');

      for (const textElement of Array.from(texts)) {
        const text = textElement as SVGTextElement;
        const nodeName = text.innerHTML.toUpperCase();
        text.setAttribute('font-family', 'Arial');

        if (this.selectedGenes.includes(nodeName)) {
          text.setAttribute('font-weight', 'bold');
        }

        if (this.increaseGenes.includes(nodeName)) {
          text.setAttribute('fill', this.colorMap['Increase'] || '#ff0000');
        } else if (this.decreaseGenes.includes(nodeName)) {
          text.setAttribute('fill', this.colorMap['Decrease'] || '#0000ff');
        } else if (this.allGenes.includes(nodeName)) {
          text.setAttribute('fill', this.colorMap['In dataset'] || '#000000');
        } else {
          text.setAttribute('fill', this.colorMap['Not in dataset'] || '#999999');
        }
      }

      const node: InteractiveSVGNode = {
        stringId: nodeId,
        preferredName: elm.getAttribute('data-safe_div_label') || '',
        ncbiTaxonId: 0,
        taxonName: '',
        annotation: '',
        x: Number(elm.getAttribute('data-x_pos')) || 0,
        y: Number(elm.getAttribute('data-y_pos')) || 0,
        radius: Number(elm.getAttribute('data-radius')) || 20,
        ix: 0,
        iy: 0,
        links: [],
        elm: elm
      };

      node.ix = node.x;
      node.iy = node.y;

      this.svgMetainfoNodes[nodeId] = node;
      elm.node = node;

      this.setupNodeDragging(elm);
      elm.addEventListener('click', (e: MouseEvent) => this.handleNodeClick(e, elm));
    });

    const linkWrappers = containerElement.querySelectorAll('.nwlinkwrapper');
    linkWrappers.forEach((elm: any) => {
      elm.addEventListener('click', (e: MouseEvent) => this.handleEdgeClick(e, elm));
    });

    const edges = containerElement.querySelectorAll('.nw_edge');
    edges.forEach((edge: any) => {
      const idFields = edge.id.split('.');
      const node1Id = 'node.' + idFields[1];
      const node2Id = 'node.' + idFields[2];

      const link: InteractiveSVGLink = {
        n1: this.svgMetainfoNodes[node1Id],
        n2: this.svgMetainfoNodes[node2Id],
        elm: edge,
        x1: Number(edge.getAttribute('x1')) || 0,
        x2: Number(edge.getAttribute('x2')) || 0,
        y1: Number(edge.getAttribute('y1')) || 0,
        y2: Number(edge.getAttribute('y2')) || 0
      };

      let lx = link.x2 - link.x1;
      let ly = link.y2 - link.y1;
      const tl = Math.sqrt(lx * lx + ly * ly);

      if (tl === 0) {
        lx = 0;
        ly = 0;
      } else {
        lx = lx / tl;
        ly = ly / tl;
      }

      lx = Math.abs(lx);
      ly = Math.abs(ly);
      if (link.n1 && link.n2) {
        if (link.n1.ix > link.n2.ix) lx *= -1;
        if (link.n1.iy > link.n2.iy) ly *= -1;
      }

      const px = -ly;
      const py = lx;

      if (link.n1) {
        link.x1 -= link.n1.x;
        link.y1 -= link.n1.y;
        let tmpx = link.x1 * lx + link.y1 * ly;
        let tmpy = link.x1 * px + link.y1 * py;
        link.x1 = tmpx;
        link.y1 = tmpy;
      }

      if (link.n2) {
        link.x2 -= link.n2.x;
        link.y2 -= link.n2.y;
        let tmpx = link.x2 * lx + link.y2 * ly;
        let tmpy = link.x2 * px + link.y2 * py;
        link.x2 = tmpx;
        link.y2 = tmpy;
      }

      if (link.n1) link.n1.links.push(link);
      if (link.n2) link.n2.links.push(link);
    });
  }

  private setupNodeDragging(element: any): void {
    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startY = 0;
    let startNodeX = 0;
    let startNodeY = 0;

    const onMouseDown = (event: MouseEvent) => {
      event.preventDefault();
      isDragging = true;
      hasMoved = false;
      startX = event.clientX;
      startY = event.clientY;
      startNodeX = element.node.x;
      startNodeY = element.node.y;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;

      if (deltaX !== 0 || deltaY !== 0) {
        hasMoved = true;
      }

      element.node.x = startNodeX + deltaX;
      element.node.y = startNodeY + deltaY;

      if (element.node.x < element.node.radius / 2) {
        element.node.x = element.node.radius / 2;
      } else if (element.node.x + element.node.radius / 2 > this.svgWidth) {
        element.node.x = this.svgWidth - element.node.radius / 2;
      }

      if (element.node.y < element.node.radius / 2) {
        element.node.y = element.node.radius / 2;
      } else if (element.node.y + element.node.radius / 2 > this.svgHeight) {
        element.node.y = this.svgHeight - element.node.radius / 2;
      }

      element.setAttribute('transform',
        `translate(${element.node.x - element.node.ix},${element.node.y - element.node.iy})`
      );

      this.updateNodeLinks(element.node);
      this.networkPositionsDirty = true;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      element.hasMoved = hasMoved;

      if (this.networkPositionsDirty) {
        this.emitPositions();
      }
    };

    element.addEventListener('mousedown', onMouseDown);
  }

  private updateNodeLinks(node: InteractiveSVGNode): void {
    for (const link of node.links) {
      let lx = link.n2.x - link.n1.x;
      let ly = link.n2.y - link.n1.y;
      const tl = Math.sqrt(lx * lx + ly * ly);

      if (tl === 0) {
        lx = 0;
        ly = 0;
      } else {
        lx = lx / tl;
        ly = ly / tl;
      }

      const px = -ly;
      const py = lx;

      link.elm.setAttribute('x1', link.n1.x + lx * link.x1 + px * link.y1);
      link.elm.setAttribute('y1', link.n1.y + ly * link.x1 + py * link.y1);
      link.elm.setAttribute('x2', link.n2.x + lx * link.x2 + px * link.y2);
      link.elm.setAttribute('y2', link.n2.y + ly * link.x2 + py * link.y2);
    }
  }

  private handleNodeClick(event: MouseEvent, element: any): void {
    if (element.hasMoved) {
      element.hasMoved = false;
      return;
    }

    event.stopPropagation();
    const idFields = element.id.split('.');
    const nodeId = idFields[1];
    const nodeName = element.getAttribute('data-safe_div_label') || '';

    this.nodeClick.emit({ nodeId, nodeName, event });
  }

  private handleEdgeClick(event: MouseEvent, element: any): void {
    event.preventDefault();
    event.stopPropagation();

    const idFields = element.id.split('.');
    const node1 = idFields[1];
    const node2 = idFields[2];

    this.edgeClick.emit({ node1, node2, event });
  }

  private emitPositions(): void {
    const positions: { [nodeId: string]: { x: number; y: number } } = {};

    for (const nodeId in this.svgMetainfoNodes) {
      const node = this.svgMetainfoNodes[nodeId];
      positions[nodeId] = { x: node.x, y: node.y };
    }

    this.positionsChanged.emit(positions);
    this.networkPositionsDirty = false;
  }

  getNodePositions(): { [nodeId: string]: { x: number; y: number } } {
    const positions: { [nodeId: string]: { x: number; y: number } } = {};

    for (const nodeId in this.svgMetainfoNodes) {
      const node = this.svgMetainfoNodes[nodeId];
      positions[nodeId] = { x: node.x, y: node.y };
    }

    return positions;
  }
}

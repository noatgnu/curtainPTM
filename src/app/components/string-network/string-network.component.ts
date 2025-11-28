import { Component, Input, OnInit, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UniprotService } from '../../uniprot.service';
import { DataService } from '../../data.service';
import { SettingsService } from '../../settings.service';
import { IDataFrame } from 'data-forge';
import { StringNetworkService, InteractiveSVGParams } from './string-network.service';
import { InteractiveNetworkComponent, NetworkColorMap, NodeClickEvent, EdgeClickEvent } from './interactive-network/interactive-network.component';

@Component({
  selector: 'app-string-network',
  templateUrl: './string-network.component.html',
  styleUrl: './string-network.component.scss',
  standalone: false
})
export class StringNetworkComponent implements OnInit {
  @ViewChild(InteractiveNetworkComponent) interactiveNetwork!: InteractiveNetworkComponent;

  @Input() set uniProtData(value: string) {
    const uni = this.uniprot.getUniprotFromAcc(value);
    if (uni) {
      this._uniProtData = uni;
      this.selected = uni['Gene Names'].split(';')[0];
      this._data = {
        organism: this.uniprot.organism,
        identifiers: this._uniProtData['STRING'].split(';'),
        selectedGenes: []
      };

      const ids: string[] = [];
      for (const i of this._data.identifiers) {
        if (i !== '') {
          ids.push(i);
        }
      }

      this.organism = this._data.organism;
      this.ids = ids;
      this.selectedGenes = this._data.selectedGenes;

      for (const i in this.colorMap()) {
        this.form.controls[i].setValue(this.colorMap()[i]);
      }

      this.loadNetwork();
    }
  }

  get uniProtData(): any {
    return this._uniProtData;
  }

  _uniProtData: any = {};
  networkType: 'functional' | 'physical' = 'physical';
  organism = '';
  ids: string[] = [];
  selected = '';
  selectedGenes: string[] = [];
  requiredScore: number = 400;
  networkFlavor: 'evidence' | 'confidence' | 'actions' = 'evidence';
  _data: any = {};

  svgContent = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');

  increaseGenes = signal<string[]>([]);
  decreaseGenes = signal<string[]>([]);
  allGenes = signal<string[]>([]);

  showInfoPanel = signal<boolean>(false);
  infoPanelProteinId = signal<string | null>(null);
  infoPanelEdgeInfo = signal<{ node1: string; node2: string } | null>(null);
  infoPanelPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  form: FormGroup = this.fb.group({
    'Increase': ['#8d0606'],
    'Decrease': ['#4f78a4'],
    'In dataset': ['#ce8080'],
    'Not in dataset': ['#676666']
  });

  colorMap = signal<NetworkColorMap>({
    'Increase': '#8d0606',
    'Decrease': '#4f78a4',
    'In dataset': '#ce8080',
    'Not in dataset': '#676666'
  });

  constructor(
    private fb: FormBuilder,
    private uniprot: UniprotService,
    private data: DataService,
    private settings: SettingsService,
    private stringService: StringNetworkService
  ) {
  }

  ngOnInit(): void {
  }

  async loadNetwork() {
    if (this.requiredScore > 1000) {
      this.requiredScore = 1000;
    }

    const increased: string[] = [];
    const decreased: string[] = [];
    const allGenes: string[] = [];

    await this.updateIncreaseDecrease(increased, decreased, allGenes, this.data.currentDF);

    this.increaseGenes.set(increased);
    this.decreaseGenes.set(decreased);
    this.allGenes.set(allGenes);

    this.loading.set(true);
    this.error.set('');

    const params: InteractiveSVGParams = {
      identifiers: this.ids,
      species: parseInt(this.organism),
      network_type: this.networkType,
      network_flavor: this.networkFlavor,
      required_score: this.requiredScore
    };

    this.stringService.getInteractiveSVGNetwork(params).subscribe({
      next: (svg) => {
        this.svgContent.set(svg);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading network:', err);
        this.error.set('Failed to load network. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private async updateIncreaseDecrease(
    increased: string[],
    decreased: string[],
    allGenes: string[],
    df: IDataFrame
  ) {
    for (const r of df) {
      const uni: any = this.uniprot.getUniprotFromAcc(r[this.data.differentialForm.primaryIDs]);
      if (uni) {
        if (r[this.data.differentialForm.foldChange] >= this.settings.settings.log2FCCutoff) {
          for (const u of uni['Gene Names'].split(';')) {
            if (u !== '') {
              increased.push(u);
            }
          }
        } else if (r[this.data.differentialForm.foldChange] <= -this.settings.settings.log2FCCutoff) {
          for (const u of uni['Gene Names'].split(';')) {
            if (u !== '') {
              decreased.push(u);
            }
          }
        }
        for (const u of uni['Gene Names'].split(';')) {
          if (u !== '') {
            allGenes.push(u);
          }
        }
      }
    }
  }


  handleNodeClick(event: NodeClickEvent) {
    this.infoPanelProteinId.set(event.nodeId);
    this.infoPanelEdgeInfo.set(null);
    this.infoPanelPosition.set({
      x: Math.min(event.event.clientX, window.innerWidth - 650),
      y: Math.min(event.event.clientY, window.innerHeight - 650)
    });
    this.showInfoPanel.set(true);
  }

  handleEdgeClick(event: EdgeClickEvent) {
    this.infoPanelProteinId.set(null);
    this.infoPanelEdgeInfo.set({ node1: event.node1, node2: event.node2 });
    this.infoPanelPosition.set({
      x: Math.min(event.event.clientX, window.innerWidth - 650),
      y: Math.min(event.event.clientY, window.innerHeight - 650)
    });
    this.showInfoPanel.set(true);
  }

  closeInfoPanel() {
    this.showInfoPanel.set(false);
    this.infoPanelProteinId.set(null);
    this.infoPanelEdgeInfo.set(null);
  }

  handlePositionsChanged(positions: { [nodeId: string]: { x: number; y: number } }) {
    console.log('Positions changed:', positions);
  }

  downloadSVG() {
    if (this.interactiveNetwork && this.interactiveNetwork.networkContainer) {
      const svg = this.interactiveNetwork.networkContainer.nativeElement.getElementsByTagName('svg');
      if (svg && svg.length > 0) {
        const blob = new Blob([svg[0].outerHTML], { type: 'image/svg+xml;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stringdb.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    }
  }

  updateColor(color: string, key: string) {
    this.form.controls[key].setValue(color);
    this.form.markAsDirty();
    const currentMap = this.colorMap();
    this.colorMap.set({ ...currentMap, [key]: color });
  }
}

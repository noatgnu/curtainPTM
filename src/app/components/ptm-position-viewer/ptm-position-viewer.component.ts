import {Component, Input, OnInit} from '@angular/core';
import {UniprotService} from "../../uniprot.service";
import {DataFrame, IDataFrame} from "data-forge";
import {BiomsaService} from "../../biomsa.service";
import {firstValueFrom, forkJoin} from "rxjs";
import {PtmService} from "../../ptm.service";
import {PlotlyService} from "angular-plotly.js";
import {DataService} from "../../data.service";
import {PspService} from "../../psp.service";
import {WebService} from "../../web.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {NetphosKinasesComponent} from "../netphos-kinases/netphos-kinases.component";
import {KinaseInfoComponent} from "../kinase-info/kinase-info.component";
import {KinaseLibraryService} from "../../kinase-library.service";
import {KinaseLibraryModalComponent} from "../kinase-library-modal/kinase-library-modal.component";
import {PtmDiseasesService} from "../../ptm-diseases.service";
import {ToastService} from "../../toast.service";

export interface PtmViewerInputData {
  accessionID: string;
  sourceMap: SourceMap;
  differential: IDataFrame;
  sequences: SequenceMap;
  unidList: UnidItem[];
  aligned: boolean;
}

export interface UnidItem {
  id?: string;
  position: number | number[];
  significant: boolean;
  score?: number;
}

export interface SourceMap {
  [key: string]: string;
}

export interface SequenceMap {
  [key: string]: string;
}

export interface ModifiedPosition {
  alignedPosition: number;
  actualPosition: number;
  gapCount: number;
  id?: string;
}

export interface AlignedPositionData {
  [position: number]: {
    [source: string]: ModifiedPosition & {
      kinases?: KinaseInfo[];
      diseases?: DiseaseInfo[];
    };
  };
}

export interface KinaseInfo {
  acc: string;
  kinase: string;
}

export interface DiseaseInfo {
  position: number;
  disease: string;
}

export interface NetPhosEntry {
  id: string;
  res: string;
  pos: number;
  score: number;
  kinase: string;
}

export interface NetPhosMap {
  [position: number]: NetPhosEntry[];
}

export interface GraphDataItem {
  x: string[];
  y: number[];
  type: string;
  text: string[];
  marker: {
    color: string[];
  };
  name: string;
  showlegend: boolean;
}

export interface PlotlyAnnotation {
  x: number;
  y: number;
  text: string;
  showarrow: boolean;
  arrowhead: number;
  ax: number;
  ay: number;
  font: {
    size: number;
    color: string;
  };
}

export interface KinaseLibraryEntry {
  position: string;
  data: KinaseLibraryData[];
}

export interface KinaseLibraryData {
  kinase: string;
  percentile: number;
}

export interface LoadingState {
  alignment: boolean;
  netphos: boolean;
  kinaseLibrary: boolean;
  drawing: boolean;
}

export interface ErrorState {
  alignment: string | null;
  netphos: string | null;
  kinaseLibrary: string | null;
}

export type SortColumn = 'position' | 'residue' | 'significant';
export type SortDirection = 'asc' | 'desc';

export interface ColorLegendItem {
  color: string;
  label: string;
}

const PTM_COLORS = {
  SELECTED: 'rgba(114,220,0,0.85)' as string,
  MODIFIED: 'rgba(154, 220, 255, 0.75)' as string,
  MODIFIED_SOLID: 'rgba(154, 220, 255)' as string,
  OVERLAP: 'rgba(209, 140, 224, 1)' as string,
  OVERLAP_PARTIAL: 'rgba(209, 140, 224' as string,
  UNMODIFIED: 'rgba(255,178,166,0.3)' as string,
  GAP: 'rgb(238, 238, 238)' as string,
  EXPERIMENTAL_DEFAULT: 'rgb(236,96,99)' as string,
  SIGNIFICANT_MARKER: 'rgb(217,4,4)' as string
};

const DATA_SOURCES = {
  EXPERIMENTAL: 'Experimental Data',
  UNIPROT: 'UniProt',
  PHOSPHOSITE_PHOSPHO: 'PhosphoSite Plus (Phosphorylation)'
} as const;

const COLOR_LEGEND: ColorLegendItem[] = [
  { color: PTM_COLORS.SELECTED, label: 'Selected' },
  { color: PTM_COLORS.OVERLAP, label: 'Overlap with database' },
  { color: PTM_COLORS.MODIFIED_SOLID, label: 'Modified (experimental)' },
  { color: PTM_COLORS.EXPERIMENTAL_DEFAULT, label: 'Experimental data' },
  { color: PTM_COLORS.UNMODIFIED, label: 'Unmodified residue' },
  { color: PTM_COLORS.GAP, label: 'Alignment gap' }
];

@Component({
  selector: 'app-ptm-position-viewer',
  templateUrl: './ptm-position-viewer.component.html',
  styleUrls: ['./ptm-position-viewer.component.scss'],
  standalone: false
})
export class PtmPositionViewerComponent implements OnInit {
  private _data: PtmViewerInputData | null = null;
  uni: Record<string, any> = {};
  accessionID: string = "";
  differential: IDataFrame = new DataFrame();
  sequences: SequenceMap = {};
  sourceMap: SourceMap = {};
  unidMap: Record<string, Record<number, UnidItem[] | any>> = {
    [DATA_SOURCES.EXPERIMENTAL]: {},
    [DATA_SOURCES.UNIPROT]: {}
  };
  aligned: boolean = false;
  divIDMap: Record<string, string> = {};
  order: string[] = [DATA_SOURCES.EXPERIMENTAL, DATA_SOURCES.UNIPROT];
  significantAnnotation: Record<string, PlotlyAnnotation[]> = {};
  graphLayout: Record<string, any> = {};
  graphData: GraphDataItem[] = [];
  customRange: [number, number] | [] = [];
  uniMods: string[] = [];
  selectedUniProt: string[] = ["Phosphoserine", "Phosphotyrosine", "Phosphothreonine"];
  alignedMap: Record<string, ModifiedPosition[]> = {};
  alignedPosition: AlignedPositionData = {};
  private _dbSelected: string[] = [];
  currentLayout: Record<string, [number, number]> = {};
  netPhosMap: NetPhosMap = {};
  kinases: Record<string, any> = {};
  kinaseLibrary: Record<string, KinaseLibraryEntry> = {};
  kinaseLibraryOpenStatus: Record<string, boolean> = {};
  showPSPLink: boolean = false;
  significantPos: number[] = [];
  accOptions: Record<string, string[]> = {};
  availableDB: string[] = [];

  loading: LoadingState = {
    alignment: false,
    netphos: false,
    kinaseLibrary: false,
    drawing: false
  };

  errors: ErrorState = {
    alignment: null,
    netphos: null,
    kinaseLibrary: null
  };

  colorLegend: ColorLegendItem[] = COLOR_LEGEND;
  showLegend: boolean = true;

  sortColumn: SortColumn = 'position';
  sortDirection: SortDirection = 'asc';
  filterText: string = '';
  showOnlySignificant: boolean = false;

  tablePageSize: number = 10;
  tableCurrentPage: number = 1;

  set dbSelected(value: string[]) {
    for (const d of this._dbSelected) {
      if (!value.includes(d)) {
        delete this.sourceMap[d];
        delete this.accOptions[d];
      }
    }
    this._dbSelected = value;

    for (const v of value) {
      if (!this.accOptions[v]) {
        this.accOptions[v] = Object.keys(this.ptm.accessDB(this.ptm.databaseNameMap[v])[this.uni["Entry"]]);
        this.sourceMap[v] = this.accOptions[v][0];
      }
    }
  }

  get dbSelected(): string[] {
    return this._dbSelected;
  }

  get isLoading(): boolean {
    return this.loading.alignment || this.loading.netphos || this.loading.drawing;
  }

  get hasErrors(): boolean {
    return !!(this.errors.alignment || this.errors.netphos || this.errors.kinaseLibrary);
  }

  get filteredAlignedData(): ModifiedPosition[] {
    if (!this.alignedMap[DATA_SOURCES.EXPERIMENTAL]) {
      return [];
    }

    let data = [...this.alignedMap[DATA_SOURCES.EXPERIMENTAL]];

    if (this.showOnlySignificant) {
      data = data.filter(d => this.significantPos.includes(d.actualPosition));
    }

    if (this.filterText.trim()) {
      const searchTerm = this.filterText.toLowerCase();
      data = data.filter(d => {
        const position = (d.actualPosition + 1).toString();
        return position.includes(searchTerm);
      });
    }

    data.sort((a, b) => {
      let comparison = 0;
      switch (this.sortColumn) {
        case 'position':
          comparison = a.actualPosition - b.actualPosition;
          break;
        case 'residue':
          const seqA = this.getResidueAt(a.alignedPosition);
          const seqB = this.getResidueAt(b.alignedPosition);
          comparison = seqA.localeCompare(seqB);
          break;
        case 'significant':
          const sigA = this.significantPos.includes(a.actualPosition) ? 1 : 0;
          const sigB = this.significantPos.includes(b.actualPosition) ? 1 : 0;
          comparison = sigB - sigA;
          break;
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    return data;
  }

  get paginatedData(): ModifiedPosition[] {
    const start = (this.tableCurrentPage - 1) * this.tablePageSize;
    const end = start + this.tablePageSize;
    return this.filteredAlignedData.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAlignedData.length / this.tablePageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.tableCurrentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  @Input() set data(value: PtmViewerInputData) {
    this._data = value;
    this.resetState();
    this.initializeFromData(value);
  }

  constructor(
    private ptmd: PtmDiseasesService,
    private kinaseLib: KinaseLibraryService,
    private modal: NgbModal,
    private web: WebService,
    public psp: PspService,
    private uniprot: UniprotService,
    private msa: BiomsaService,
    public ptm: PtmService,
    private plot: PlotlyService,
    public dataService: DataService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {}

  private resetState(): void {
    this.errors = { alignment: null, netphos: null, kinaseLibrary: null };
    this.tableCurrentPage = 1;
    this.filterText = '';
    this.showOnlySignificant = false;
  }

  private initializeFromData(value: PtmViewerInputData): void {
    this.accessionID = value.accessionID;

    if (Object.keys(this.sourceMap).length === 0) {
      this.sourceMap = value.sourceMap;
    }

    const uni = this.uniprot.getUniprotFromAcc(this.accessionID);
    if (uni) {
      this.initializeUniprotData(uni);
    }

    this.initializeDbIdMap();
    this.differential = value.differential;
    this.sequences = value.sequences;
    this.initializeExperimentalData(value.unidList);

    if (value.accessionID) {
      this.aligned = value.aligned;
      this.ptm.getGlyco(this.uni["Entry"]).then();
      this.processAndDraw();
    }
  }

  private initializeUniprotData(uni: any): void {
    this.getKinaseLibrary();
    this.uni = uni;
    const mods: Record<string, any[]> = {};

    if (this.uni["Modified residue"]) {
      this.uni["Modified residue"].forEach((m: any) => {
        if (!mods[m.modType]) {
          mods[m.modType] = [];
        }
        mods[m.modType].push(m);
      });
    }

    this.uniMods = Object.keys(mods);
    this.initializeAvailableDBs();
  }

  private initializeAvailableDBs(): void {
    for (const d of this.ptm.databases) {
      if (d.value !== "GLYCONNECTN" && d.value !== "GLYCONNECTO") {
        const db = this.ptm.accessDB(d.value);
        if (db[this.uni["Entry"]]) {
          this.availableDB.push(d.name);
        }
      }
    }
  }

  private initializeDbIdMap(): void {
    if (this.dataService.dbIDMap[this.accessionID]) {
      const keys = Object.keys(this.dataService.dbIDMap[this.accessionID]);
      if (keys.length > 0) {
        for (const key of keys) {
          if (key !== DATA_SOURCES.UNIPROT && key !== DATA_SOURCES.EXPERIMENTAL) {
            this._dbSelected.push(key);
          }
        }
        for (const d of this._dbSelected) {
          const dbName = this.ptm.databaseNameMap[d];
          const db = this.ptm.accessDB(dbName);
          this.accOptions[d] = Object.keys(db[this.uni["Entry"]]);
          this.sourceMap[d] = this.dataService.dbIDMap[this.accessionID][d];
        }
      }
    } else {
      this.dataService.dbIDMap[this.accessionID] = {};
    }
  }

  private initializeExperimentalData(unidList: UnidItem[]): void {
    this.unidMap[DATA_SOURCES.EXPERIMENTAL] = {};
    for (const u of unidList) {
      const positions = this.getAllArrayValues(u.position);
      for (const position of positions) {
        const posIndex = position - 1;
        if (!this.unidMap[DATA_SOURCES.EXPERIMENTAL][posIndex]) {
          this.unidMap[DATA_SOURCES.EXPERIMENTAL][posIndex] = [];
        }
        this.unidMap[DATA_SOURCES.EXPERIMENTAL][posIndex].push(u);
        if (u.significant) {
          this.significantPos.push(posIndex);
        }
      }
    }
  }

  private async processAndDraw(): Promise<void> {
    try {
      this.loading.alignment = true;
      this.errors.alignment = null;
      await this.align();
    } catch (error) {
      this.errors.alignment = 'Failed to align sequences. Please try again.';
      this.toast.show('Error', 'Sequence alignment failed').then();
    } finally {
      this.loading.alignment = false;
    }

    this.fetchNetPhosData();
    this.gatherMods();

    try {
      this.loading.drawing = true;
      await this.drawHeatmap();
    } catch (error) {
      this.toast.show('Error', 'Failed to draw visualization').then();
    } finally {
      this.loading.drawing = false;
    }
  }

  private fetchNetPhosData(): void {
    const experimentalSource = this.sourceMap[DATA_SOURCES.EXPERIMENTAL];
    const sequence = this.sequences[experimentalSource];

    this.loading.netphos = true;
    this.errors.netphos = null;

    this.web.postNetphos(experimentalSource, sequence).subscribe({
      next: (data) => {
        if (data.body) {
          this.netPhosMap = this.parseNetphos((data.body as any)["data"]);
        }
        this.loading.netphos = false;
      },
      error: () => {
        this.errors.netphos = 'Failed to fetch NetPhos predictions';
        this.loading.netphos = false;
      }
    });
  }

  async drawHeatmap(): Promise<void> {
    this.showPSPLink = false;
    const temp: Record<string, GraphDataItem> = {};
    const gapCount: Record<string, number> = {};
    const labels: string[] = Object.keys(this.sourceMap);
    this.significantAnnotation = {};

    this.initializeGraphStructures(labels, temp, gapCount);

    const modified = this.composeGraphData(
      DATA_SOURCES.EXPERIMENTAL,
      temp,
      gapCount,
      PTM_COLORS.EXPERIMENTAL_DEFAULT
    );

    this.alignedMap[DATA_SOURCES.EXPERIMENTAL] = modified;

    this.processOtherDataSources(labels, temp, gapCount, modified);
    await this.processKinaseData(labels);

    this.graphData = Object.values(temp);
  }

  private initializeGraphStructures(
    labels: string[],
    temp: Record<string, GraphDataItem>,
    gapCount: Record<string, number>
  ): void {
    for (const label of labels) {
      this.dataService.dbIDMap[this.accessionID][label] = this.sourceMap[label];
      this.currentLayout[label] = [0, 0];
      this.divIDMap[label] = label.replace(/\s/g, "") + this.sourceMap[label];

      this.graphLayout[label] = this.createGraphLayout(label);
      temp[label] = this.createEmptyGraphData(label);
      gapCount[label] = 0;
    }
  }

  private createGraphLayout(label: string): any {
    return {
      xaxis: {
        showticklabels: false,
        type: 'category',
        tickmode: 'array',
        visible: false,
      },
      yaxis: {
        showticklabels: false,
        range: [0, 1.3],
        visible: false,
        fixedrange: true
      },
      title: {
        text: label + (this.sourceMap[label] ? " <b>" + this.sourceMap[label] + "</b>" : ""),
        font: { size: 14 }
      },
      margin: { t: 25, b: 25, r: 25, l: 25 },
      hovermode: 'closest'
    };
  }

  private createEmptyGraphData(name: string): GraphDataItem {
    return {
      x: [],
      y: [],
      type: "bar",
      text: [],
      marker: {
        color: []
      },
      name: name,
      showlegend: false
    };
  }

  private processOtherDataSources(
    labels: string[],
    temp: Record<string, GraphDataItem>,
    gapCount: Record<string, number>,
    experimentalModified: ModifiedPosition[]
  ): void {
    for (const label of labels) {
      if (label.startsWith("PhosphoSite Plus")) {
        this.showPSPLink = true;
      }
      if (label !== DATA_SOURCES.EXPERIMENTAL) {
        this.alignedMap[label] = this.composeGraphData(label, temp, gapCount);
        this.markOverlappingPositions(temp, experimentalModified, label);
      }
    }
  }

  private markOverlappingPositions(
    temp: Record<string, GraphDataItem>,
    experimentalModified: ModifiedPosition[],
    label: string
  ): void {
    for (const mod of experimentalModified) {
      const labelColor = temp[label].marker.color[mod.alignedPosition];
      if (labelColor && labelColor.startsWith(PTM_COLORS.OVERLAP_PARTIAL.replace(',', ''))) {
        temp[label].marker.color[mod.alignedPosition] = labelColor.replace(
          PTM_COLORS.OVERLAP_PARTIAL.replace(',', ''),
          PTM_COLORS.OVERLAP_PARTIAL
        );
        if (temp[DATA_SOURCES.EXPERIMENTAL].marker.color[mod.alignedPosition] !== PTM_COLORS.SELECTED) {
          temp[DATA_SOURCES.EXPERIMENTAL].marker.color[mod.alignedPosition] = PTM_COLORS.OVERLAP;
        }
      }
    }
  }

  private async processKinaseData(labels: string[]): Promise<void> {
    const kinaseAccessions: string[] = [];
    const originalAccessions: string[] = [];

    for (const label in this.alignedMap) {
      for (const alignedMod of this.alignedMap[label]) {
        this.initializeAlignedPosition(alignedMod, label);

        if (label === DATA_SOURCES.UNIPROT) {
          this.addDiseaseData(alignedMod);
        }

        if (label === DATA_SOURCES.PHOSPHOSITE_PHOSPHO) {
          this.addKinaseData(alignedMod, kinaseAccessions, originalAccessions);
        }
      }
    }

    if (kinaseAccessions.length > 0) {
      await this.uniprot.UniprotParserJS(kinaseAccessions);
      for (const acc of originalAccessions) {
        this.kinases[acc] = this.uniprot.getUniprotFromAcc(acc);
      }
    }
  }

  private initializeAlignedPosition(mod: ModifiedPosition, label: string): void {
    if (!this.alignedPosition[mod.alignedPosition]) {
      this.alignedPosition[mod.alignedPosition] = {};
    }
    if (!this.alignedPosition[mod.alignedPosition][label]) {
      this.alignedPosition[mod.alignedPosition][label] = mod;
    }
  }

  private addDiseaseData(mod: ModifiedPosition): void {
    const diseases = this.ptmd.getPTMDiseases(this.uni["Entry"]);
    if (diseases) {
      this.alignedPosition[mod.alignedPosition][DATA_SOURCES.UNIPROT]["diseases"] = diseases.filter(
        (d: DiseaseInfo) => d.position === mod.actualPosition + 1
      );
    }
  }

  private addKinaseData(
    mod: ModifiedPosition,
    kinaseAccessions: string[],
    originalAccessions: string[]
  ): void {
    const kinases = this.getKinase(mod.actualPosition);
    this.alignedPosition[mod.alignedPosition][DATA_SOURCES.PHOSPHOSITE_PHOSPHO]["kinases"] = kinases;

    for (const kinase of kinases) {
      const uni = this.uniprot.getUniprotFromAcc(kinase.acc);
      const accessionMatch = this.uniprot.Re.exec(kinase.acc);

      if (accessionMatch) {
        if (!uni) {
          this.dataService.dataMap.set(kinase.acc, accessionMatch[1]);
          this.uniprot.accMap.set(kinase.acc, accessionMatch[1]);
          kinaseAccessions.push(accessionMatch[1]);
          originalAccessions.push(kinase.acc);
        } else {
          this.kinases[kinase.acc] = uni;
        }
      }
    }
  }

  private composeGraphData(
    source: string,
    temp: Record<string, GraphDataItem>,
    gapCount: Record<string, number>,
    foundColor: string = PTM_COLORS.MODIFIED
  ): ModifiedPosition[] {
    const modified: ModifiedPosition[] = [];
    const acc = this.sourceMap[source];
    const seq = this.sequences[acc];

    for (let i = 0; i < seq.length; i++) {
      const { color, text, mod } = this.processSequencePosition(
        source,
        seq,
        i,
        gapCount,
        foundColor
      );

      temp[source].x.push(seq[i] + "." + (i + 1));
      temp[source].y.push(1);
      temp[source].marker.color.push(color);
      temp[source].text.push(text);

      if (mod) {
        modified.push(mod);
      }
    }

    this.applyLayoutSettings(source);
    return modified;
  }

  private processSequencePosition(
    source: string,
    seq: string,
    index: number,
    gapCount: Record<string, number>,
    foundColor: string
  ): { color: string; text: string; mod: ModifiedPosition | null } {
    if (seq[index] === "-") {
      gapCount[source]++;
      return { color: PTM_COLORS.GAP, text: "-", mod: null };
    }

    const actualPosition = index - gapCount[source];
    const unidData = this.unidMap[source][actualPosition];

    if (unidData) {
      return this.processModifiedPosition(source, seq[index], index, actualPosition, gapCount[source], unidData, foundColor);
    }

    return {
      color: PTM_COLORS.UNMODIFIED,
      text: seq[index] + "(" + (actualPosition + 1) + ")",
      mod: null
    };
  }

  private processModifiedPosition(
    source: string,
    residue: string,
    alignedPos: number,
    actualPos: number,
    gaps: number,
    unidData: UnidItem[],
    foundColor: string
  ): { color: string; text: string; mod: ModifiedPosition } {
    const mod: ModifiedPosition = {
      alignedPosition: alignedPos,
      actualPosition: actualPos,
      gapCount: gaps
    };

    let color = foundColor;

    if (unidData[0]) {
      color = this.determineModificationColor(source, mod, unidData, foundColor);
    }

    return {
      color,
      text: residue + "(" + (actualPos + 1) + "): Modified",
      mod
    };
  }

  private determineModificationColor(
    source: string,
    mod: ModifiedPosition,
    unidData: UnidItem[],
    foundColor: string
  ): string {
    let color = PTM_COLORS.MODIFIED_SOLID;
    let hasMatch = false;

    for (const unid of unidData) {
      if (unid.id) {
        mod.id = unid.id;

        if (source === DATA_SOURCES.EXPERIMENTAL) {
          this.addSignificantAnnotation(source, mod.alignedPosition, mod.actualPosition);
        }

        if (this.dataService.selectedMap[unid.id]) {
          color = PTM_COLORS.SELECTED;
          hasMatch = true;
        }
      }
    }

    return hasMatch ? color : foundColor;
  }

  private addSignificantAnnotation(source: string, alignedPos: number, actualPos: number): void {
    if (!this.significantAnnotation[source]) {
      this.significantAnnotation[source] = [];
    }

    const isSignificant = this.significantPos.includes(actualPos);
    if (actualPos && isSignificant) {
      this.significantAnnotation[source].push({
        x: alignedPos,
        y: 1.25,
        text: "*",
        showarrow: false,
        arrowhead: 2,
        ax: 0,
        ay: 0,
        font: {
          size: 10,
          color: PTM_COLORS.SIGNIFICANT_MARKER
        }
      });
    }
  }

  private applyLayoutSettings(source: string): void {
    if (this.significantAnnotation[source]) {
      this.graphLayout[source].annotations = this.significantAnnotation[source];
    }
    if (this.customRange.length > 0) {
      this.graphLayout[source].xaxis.range = this.customRange;
    }
  }

  updateBoundary(event: any): void {
    this.customRange = [event["xaxis.range[0]"], event["xaxis.range[1]"]];
    this.drawHeatmap().then();
  }

  async align(): Promise<void> {
    const toBeAligned: SequenceMap = {};
    for (const s in this.sequences) {
      toBeAligned[s] = this.sequences[s].replace(/-/g, "");
    }

    const toBeRetrieved: Record<string, any> = {};
    for (const v of Object.values(this.sourceMap)) {
      if (!toBeAligned[v]) {
        toBeRetrieved[v] = this.uniprot.getUniprotFasta(v);
      }
    }

    if (Object.keys(toBeRetrieved).length > 0) {
      const results = await firstValueFrom(forkJoin(toBeRetrieved)) as Record<string, string>;
      if (results) {
        for (const r in toBeRetrieved) {
          toBeAligned[r] = this.uniprot.parseFasta(results[r]);
        }
      }
    }

    if (Object.keys(toBeAligned).length > 1) {
      const msa = await this.msa.alignSequences(toBeAligned);
      const seqLabels = Object.keys(toBeAligned);
      for (let i = 0; i < seqLabels.length; i++) {
        this.sequences[seqLabels[i]] = msa[i];
      }
    }
  }

  gatherMods(): void {
    this.gatherUniprotMods();
    this.gatherDatabaseMods();
  }

  private gatherUniprotMods(): void {
    if (this.uni["Modified residue"]) {
      this.uni["Modified residue"].forEach((m: any) => {
        if (this.selectedUniProt.includes(m.modType)) {
          this.unidMap[DATA_SOURCES.UNIPROT][m.position - 1] = m;
        }
      });
    }
  }

  private gatherDatabaseMods(): void {
    for (const dbName of this.dbSelected) {
      const dbKey = this.ptm.databaseNameMap[dbName];
      const db = this.ptm.accessDB(dbKey);

      if (!this.accOptions[dbName]) {
        this.accOptions[dbName] = Object.keys(db[this.uni["Entry"]]);
        this.sourceMap[dbName] = this.accOptions[dbName][0];
      }

      this.unidMap[dbName] = {};
      for (const m of db[this.uni["Entry"]][this.sourceMap[dbName]]) {
        this.unidMap[dbName][m.position] = m;
      }
    }
  }

  reDraw(): void {
    this.loading.drawing = true;
    this.align().then(() => {
      this.gatherMods();
      this.drawHeatmap().then(() => {
        this.loading.drawing = false;
      });
    }).catch(() => {
      this.loading.drawing = false;
      this.toast.show('Error', 'Failed to redraw visualization').then();
    });
  }

  relayout(): void {}

  getKinase(position: number): KinaseInfo[] {
    const substrateData = this.psp.substrateKinaseMap[this.uni["Entry"]];
    if (!substrateData) {
      return [];
    }

    const sourceData = substrateData[this.sourceMap[DATA_SOURCES.PHOSPHOSITE_PHOSPHO]];
    if (!sourceData) {
      return [];
    }

    return sourceData[position] || [];
  }

  parseNetphos(data: string): NetPhosMap {
    const lines = data.split("\n");
    const result: NetPhosMap = {};

    for (const line of lines) {
      const parts = line.split(" ");
      if (parts.length > 1) {
        const entry: NetPhosEntry = {
          id: parts[2],
          res: parts[1],
          pos: parseInt(parts[3]),
          score: parseFloat(parts[4]),
          kinase: parts[6].replace("\t", "")
        };

        if (!result[entry.pos]) {
          result[entry.pos] = [];
        }
        result[entry.pos].push(entry);
      }
    }

    for (const pos in result) {
      result[pos].sort((a, b) => b.score - a.score);
    }

    return result;
  }

  openNetPhos(position: number): void {
    const ref = this.modal.open(NetphosKinasesComponent);
    ref.componentInstance.data = this.netPhosMap[position];
  }

  openKinaseInfo(kinase: KinaseInfo): void {
    const ref = this.modal.open(KinaseInfoComponent, { size: "xl" });
    ref.componentInstance.uni = this.kinases[kinase.acc];
  }

  downloadSVG(): void {
    for (const g of this.graphData) {
      this.web.downloadPlotlyImage("svg", this.divIDMap[g.name], this.divIDMap[g.name]);
    }
    this.toast.show('Success', 'SVG files downloaded').then();
  }

  downloadPNG(): void {
    for (const g of this.graphData) {
      this.web.downloadPlotlyImage("png", this.divIDMap[g.name], this.divIDMap[g.name]);
    }
    this.toast.show('Success', 'PNG files downloaded').then();
  }

  downloadCSV(): void {
    const headers = ['Position', 'Aligned Position', 'Residue', 'Significant', 'Selected', 'ID'];

    for (const g of this.graphData) {
      headers.push(g.name);
    }

    const rows: string[][] = [headers];

    for (const mod of this.filteredAlignedData) {
      const row: string[] = [
        (mod.actualPosition + 1).toString(),
        (mod.alignedPosition + 1).toString(),
        this.getResidueAt(mod.alignedPosition),
        this.significantPos.includes(mod.actualPosition) ? 'Yes' : 'No',
        mod.id && this.dataService.selectedMap[mod.id] ? 'Yes' : 'No',
        mod.id || ''
      ];

      for (const g of this.graphData) {
        const posData = this.alignedPosition[mod.alignedPosition]?.[g.name];
        row.push(posData ? (posData.actualPosition + 1).toString() : '-');
      }

      rows.push(row);
    }

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ptm_positions_${this.accessionID}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.toast.show('Success', 'CSV file downloaded').then();
  }

  getKinaseLibrary(): void {
    if (!this._data) {
      return;
    }

    this.loading.kinaseLibrary = true;
    this.errors.kinaseLibrary = null;

    this.kinaseLib.get_kinase(this._data.accessionID).subscribe({
      next: (data: any) => {
        for (const item of data.results) {
          const result: KinaseLibraryData[] = [];

          for (const kinase in item.data) {
            item.data[kinase]["kinase"] = kinase;
            result.push(item.data[kinase]);
          }

          item.data = result.sort((a, b) => b.percentile - a.percentile);
          this.kinaseLibrary[item.position.toString()] = item;
          this.kinaseLibraryOpenStatus[item.position.toString()] = false;
        }
        this.loading.kinaseLibrary = false;
      },
      error: () => {
        this.errors.kinaseLibrary = 'Failed to load kinase library data';
        this.loading.kinaseLibrary = false;
      }
    });
  }

  toggleKinaseLibraryOpenStatus(position: number): void {
    const ref = this.modal.open(KinaseLibraryModalComponent, { scrollable: true });
    const sequence = this.sequences[this.sourceMap[DATA_SOURCES.EXPERIMENTAL]].replace(/-/g, "");
    const site = sequence[position - 1];
    const prefix = sequence.slice(position - 11, position - 1);
    const suffix = sequence.slice(position, position + 10);

    ref.componentInstance.sequenceWindow = prefix + site.toLowerCase() + suffix;

    if (this.kinaseLibrary[position.toString()]) {
      ref.componentInstance.data = this.kinaseLibrary[position.toString()];
    } else {
      this.kinaseLib.getKinaseLibrary(ref.componentInstance.sequenceWindow).subscribe({
        next: (data: any) => {
          ref.componentInstance.directData = data;
        },
        error: () => {
          this.toast.show('Error', 'Failed to fetch kinase library data').then();
        }
      });
    }
  }

  getAllArrayValues(value: number | number[]): number[] {
    if (Array.isArray(value)) {
      return value.filter(v => typeof v === 'number' && !isNaN(v));
    }
    return typeof value === 'number' && !isNaN(value) ? [value] : [];
  }

  getResidueAt(alignedPosition: number): string {
    const expSource = this.sourceMap[DATA_SOURCES.EXPERIMENTAL];
    const seq = this.sequences[expSource];
    return seq ? seq[alignedPosition] : '';
  }

  sortBy(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.tableCurrentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.tableCurrentPage = page;
    }
  }

  onFilterChange(): void {
    this.tableCurrentPage = 1;
  }

  toggleSignificantFilter(): void {
    this.showOnlySignificant = !this.showOnlySignificant;
    this.tableCurrentPage = 1;
  }

  toggleLegend(): void {
    this.showLegend = !this.showLegend;
  }

  getSequenceWindow(position: number, windowSize: number = 7): string {
    const expSource = this.sourceMap[DATA_SOURCES.EXPERIMENTAL];
    const seq = this.sequences[expSource]?.replace(/-/g, '') || '';
    const start = Math.max(0, position - windowSize);
    const end = Math.min(seq.length, position + windowSize + 1);

    let window = '';
    for (let i = start; i < end; i++) {
      if (i === position) {
        window += `[${seq[i]}]`;
      } else {
        window += seq[i];
      }
    }
    return window;
  }

  isPositionSignificant(position: number): boolean {
    return this.significantPos.includes(position);
  }

  dismissError(errorType: keyof ErrorState): void {
    this.errors[errorType] = null;
  }
}

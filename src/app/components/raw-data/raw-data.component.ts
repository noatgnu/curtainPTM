import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";

export interface RawDataItem {
  id: string;
  position: number | number[];
  residue?: string;
  significant?: boolean;
  score?: number;
}

export interface PositionMapEntry {
  id: string;
  position: number | number[];
  residue?: string;
}

export interface PeptideSegment {
  text: string;
  isHighlighted: boolean;
}

export interface PeptideRenderResult {
  before: string;
  highlighted: string[];
  after: string;
  segments: PeptideSegment[];
}

export type SortColumn = 'primaryID' | 'residue' | 'position' | 'foldChange' | 'significant' | 'score';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-raw-data',
  templateUrl: './raw-data.component.html',
  styleUrls: ['./raw-data.component.scss'],
  standalone: false
})
export class RawDataComponent implements OnInit {
  _data: RawDataItem[] = [];
  unidList: string[] = [];
  positionMap: Record<string, PositionMapEntry> = {};
  differentialData: IDataFrame = new DataFrame();
  barChartState: Record<string, boolean> = {};
  rawDataMap: Record<string, any> = {};
  annotateMap: Record<string, boolean> = {};
  profilePlotMap: Record<string, boolean> = {};
  sortReverse: Record<string, boolean> = {};

  sortColumn: SortColumn = 'foldChange';
  sortDirection: SortDirection = 'desc';
  filterText: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  isLoading: boolean = false;

  @Input() set data(value: RawDataItem[]) {
    this.isLoading = true;
    this._data = value;
    this.initializeData(value);
    this.isLoading = false;
  }

  @Input() set toggle(value: string) {
    if (value !== "") {
      this.annotateMap[value] = !this.annotateMap[value];
      this.annotate(value);
    }
  }

  get data(): RawDataItem[] {
    return this._data;
  }

  get filteredData(): IDataFrame {
    if (!this.filterText.trim()) {
      return this.differentialData;
    }

    const searchTerm = this.filterText.toLowerCase();
    return this.differentialData.where(row => {
      const primaryID = String(row[this.dataService.differentialForm.primaryIDs] || '').toLowerCase();
      const position = String(row[this.dataService.differentialForm.position] || '');
      return primaryID.includes(searchTerm) || position.includes(searchTerm);
    }).bake();
  }

  get sortedData(): IDataFrame {
    const data = this.filteredData;
    const columnMap: Record<SortColumn, string> = {
      primaryID: this.dataService.differentialForm.primaryIDs,
      residue: this.dataService.differentialForm.positionPeptide,
      position: this.dataService.differentialForm.position,
      foldChange: this.dataService.differentialForm.foldChange,
      significant: this.dataService.differentialForm.significant,
      score: this.dataService.differentialForm.score
    };

    const column = columnMap[this.sortColumn];
    if (!column) {
      return data;
    }

    if (this.sortDirection === 'asc') {
      return data.orderBy(row => row[column]).bake();
    }
    return data.orderByDescending(row => row[column]).bake();
  }

  get paginatedData(): any[] {
    const allData = this.sortedData.toArray();
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return allData.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredData.count() / this.pageSize);
  }

  get totalItems(): number {
    return this.filteredData.count();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  constructor(
    public dataService: DataService,
    private settings: SettingsService
  ) {
    this.dataService.batchAnnotateAnnoucement.subscribe((data: any) => {
      for (const i of data.id) {
        if (i in this.annotateMap) {
          this.annotateMap[i] = !data.remove;
        }
      }
    });
  }

  ngOnInit(): void {}

  private initializeData(value: RawDataItem[]): void {
    this.unidList = [];
    this.positionMap = {};
    this.barChartState = {};
    this.annotateMap = {};
    this.profilePlotMap = {};

    value.forEach(u => {
      this.unidList.push(u.id);
      this.positionMap[u.id] = u;
      this.barChartState[u.id] = false;
      this.annotateMap[u.id] = false;
      this.profilePlotMap[u.id] = false;

      for (const i in this.settings.settings.textAnnotation) {
        if (this.settings.settings.textAnnotation[i].primary_id === u.id) {
          this.annotateMap[u.id] = true;
          break;
        }
      }

      if (this.settings.settings.selectedComparison.includes(u.id)) {
        this.profilePlotMap[u.id] = true;
      }
    });

    this.differentialData = this.dataService.currentDF
      .where(r => this.unidList.includes(r[this.dataService.differentialForm.primaryIDs]))
      .bake();

    const rawData = this.dataService.raw.df
      .where(r => this.unidList.includes(r[this.dataService.rawForm.primaryIDs]))
      .bake();

    rawData.forEach(row => this.rawDataMap[row[this.dataService.rawForm.primaryIDs]] = row);
    this.currentPage = 1;
  }

  sortBy(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.currentPage = 1;
  }

  sortHeader(headerName: string): void {
    if (!(headerName in this.sortReverse)) {
      this.sortReverse[headerName] = false;
    }

    if (this.sortReverse[headerName]) {
      this.differentialData = this.differentialData.orderBy(row => row[headerName]).bake();
    } else {
      this.differentialData = this.differentialData.orderByDescending(row => row[headerName]).bake();
    }

    this.sortReverse[headerName] = !this.sortReverse[headerName];
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  viewBarChartToggle(unid: string): void {
    this.barChartState[unid] = !this.barChartState[unid];
  }

  annotate(uid: string): void {
    const remove = !this.annotateMap[uid];
    this.dataService.annotationService.next({
      id: uid,
      remove: remove
    });
    this.dataService.annotatedMap[uid] = this.annotateMap[uid];
  }

  profilePlotToggle(uid: string): void {
    if (this.settings.settings.selectedComparison.includes(uid)) {
      this.settings.settings.selectedComparison = this.settings.settings.selectedComparison.filter(u => u !== uid);
    } else {
      this.settings.settings.selectedComparison.push(uid);
    }
  }

  downloadCSV(): void {
    const headers = [
      'UID',
      'Residue',
      'Position',
      'Fold Change',
      'P-value',
      'Sequence Window',
      'Peptide Sequence',
      'Localization Score'
    ];

    const rows: string[][] = [headers];

    this.sortedData.forEach(d => {
      const row: string[] = [
        d[this.dataService.differentialForm.primaryIDs] || '',
        this.getModifiedResidues(d).join(';'),
        this.formatPosition(d[this.dataService.differentialForm.position]),
        String(d[this.dataService.differentialForm.foldChange] || ''),
        String(d[this.dataService.differentialForm.significant] || ''),
        this.formatSequenceWindow(d[this.dataService.differentialForm.sequence]),
        this.formatPeptideSequence(d[this.dataService.differentialForm.peptideSequence]),
        String(d[this.dataService.differentialForm.score] || '')
      ];
      rows.push(row);
    });

    const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'raw_data_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private formatPosition(position: any): string {
    if (Array.isArray(position)) {
      return position.join(';');
    }
    return String(position || '');
  }

  private formatSequenceWindow(sequence: any): string {
    if (Array.isArray(sequence)) {
      return sequence.join(';');
    }
    return String(sequence || '');
  }

  private formatPeptideSequence(peptide: any): string {
    if (Array.isArray(peptide)) {
      return peptide.join(';');
    }
    return String(peptide || '');
  }

  isSignificant(row: any): boolean {
    const pValue = row[this.dataService.differentialForm.significant];
    const fcValue = Math.abs(row[this.dataService.differentialForm.foldChange] || 0);
    return pValue >= this.settings.settings.pCutoff && fcValue >= this.settings.settings.log2FCCutoff;
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  getSequenceArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value;
    }
    return typeof value === 'string' ? value.split(';') : [];
  }

  getPositionValue(positions: any, index: number): number {
    if (Array.isArray(positions)) {
      return positions[index] || positions[0] || 1;
    }
    return positions || 1;
  }

  getSequenceWindowCenter(sequenceWindow: string): number {
    const length = sequenceWindow.length;

    if (length % 2 === 1) {
      return Math.floor(length / 2);
    } else {
      return Math.floor(length / 2) - 1;
    }
  }

  getModifiedResidues(d: any): string[] {
    const peptideSequences = this.isArray(d[this.dataService.differentialForm.peptideSequence])
      ? d[this.dataService.differentialForm.peptideSequence]
      : [d[this.dataService.differentialForm.peptideSequence]];

    const positionsInPeptide = this.isArray(d[this.dataService.differentialForm.positionPeptide])
      ? d[this.dataService.differentialForm.positionPeptide]
      : [d[this.dataService.differentialForm.positionPeptide]];

    const residues: string[] = [];

    for (let i = 0; i < peptideSequences.length; i++) {
      const peptide = peptideSequences[i];
      const position = positionsInPeptide[i] || positionsInPeptide[0] || 1;
      if (peptide && position > 0 && position <= peptide.length) {
        residues.push(peptide[position - 1]);
      }
    }

    return residues;
  }

  renderPeptideWithHighlights(peptide: string, positionsInPeptide: number[]): PeptideRenderResult {
    if (!peptide || !positionsInPeptide || positionsInPeptide.length === 0) {
      return {before: peptide || '', highlighted: [], after: '', segments: [{text: peptide || '', isHighlighted: false}]};
    }

    const sortedPositions = [...positionsInPeptide].sort((a, b) => a - b);
    const segments: PeptideSegment[] = [];
    let currentIndex = 0;

    for (const position of sortedPositions) {
      const adjustedPosition = position - 1;

      if (adjustedPosition >= 0 && adjustedPosition < peptide.length) {
        if (currentIndex < adjustedPosition) {
          segments.push({
            text: peptide.slice(currentIndex, adjustedPosition),
            isHighlighted: false
          });
        }

        segments.push({
          text: peptide[adjustedPosition],
          isHighlighted: true
        });

        currentIndex = adjustedPosition + 1;
      }
    }

    if (currentIndex < peptide.length) {
      segments.push({
        text: peptide.slice(currentIndex),
        isHighlighted: false
      });
    }

    const highlighted = sortedPositions
      .filter(pos => pos > 0 && pos <= peptide.length)
      .map(pos => peptide[pos - 1]);

    return {
      before: '',
      highlighted,
      after: '',
      segments
    };
  }
}

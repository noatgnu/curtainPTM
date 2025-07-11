import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {DataService} from "../../data.service";
import {SettingsService} from "../../settings.service";
//import {ContextMenuComponent} from "ngx-contextmenu";

@Component({
    selector: 'app-raw-data',
    templateUrl: './raw-data.component.html',
    styleUrls: ['./raw-data.component.scss'],
    standalone: false
})
export class RawDataComponent implements OnInit {
  _data: any[] = []
  unidList: string[] = []
  positionMap: any = {}
  differentialData: IDataFrame = new DataFrame()
  barChartState: any = {}
  rawDataMap: any = {}
  //@ViewChild(ContextMenuComponent)
  //public basicMenu!: ContextMenuComponent;
  @Input() set data(value: any[]) {
    this._data = value
    this._data.forEach(u => {
      this.unidList.push(u.id)
      this.positionMap[u.id] = u
      this.barChartState[u.id] = false
      this.annotateMap[u.id] = false
      this.profilePlotMap[u.id] = false
      for (const i in this.settings.settings.textAnnotation) {
        if (this.settings.settings.textAnnotation[i].primary_id === u.id) {
          this.annotateMap[u.id] = true
          break
        }
      }
      if (this.settings.settings.selectedComparison.includes(u.id)) {
        this.profilePlotMap[u.id] = true
      }
    })
    this.differentialData = this.dataService.currentDF.where(r => this.unidList.includes(r[this.dataService.differentialForm.primaryIDs])).bake()
    const rawData = this.dataService.raw.df.where(r => this.unidList.includes(r[this.dataService.rawForm.primaryIDs])).bake()
    rawData.forEach(row => this.rawDataMap[row[this.dataService.rawForm.primaryIDs]] = row)
  }

  @Input() set toggle(value: string) {
    if (value !== "") {
      this.annotateMap[value] = !this.annotateMap[value]
      console.log(this.annotateMap[value])
      this.annotate(value)
    }
  }
  sortReverse: any = {}

  get data(): any[] {
    return this._data
  }
  annotateMap: any = {}
  profilePlotMap: any = {}
  constructor(public dataService: DataService, private settings: SettingsService) {
    this.dataService.batchAnnotateAnnoucement.subscribe((data: any) => {
      for (const i of data.id) {
        if (i in this.annotateMap) {
          this.annotateMap[i] = !data.remove
        }
      }
    })
  }

  ngOnInit(): void {
  }

  sortHeader(headerName: string) {
    if (!(headerName in this.sortReverse)) {
      this.sortReverse[headerName] = false
    }

    if (this.sortReverse[headerName]) {
      this.differentialData = this.differentialData.orderBy(row => row[headerName]).bake()
    } else {
      this.differentialData = this.differentialData.orderByDescending(row => row[headerName]).bake()
    }

    this.sortReverse[headerName] = !this.sortReverse[headerName]
  }

  viewBarChartToggle(unid: string) {
    this.barChartState[unid] = !this.barChartState[unid]
  }

  annotate(uid: string) {
    let remove = false
    if (!this.annotateMap[uid]) {
      remove = true
    }
    this.dataService.annotationService.next({
      id: uid,
      remove: remove
    })
    this.dataService.annotatedMap[uid] = this.annotateMap[uid]
  }

  profilePlotToggle(uid: string) {
    if (this.settings.settings.selectedComparison.includes(uid)) {
      this.settings.settings.selectedComparison = this.settings.settings.selectedComparison.filter(u => u !== uid)
    } else {
      this.settings.settings.selectedComparison.push(uid)
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value)
  }

  getSequenceArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value
    }
    return typeof value === 'string' ? value.split(';') : []
  }

  getPositionValue(positions: any, index: number): number {
    if (Array.isArray(positions)) {
      return positions[index] || positions[0] || 1
    }
    return positions || 1
  }

  getSequenceWindowCenter(sequenceWindow: string): number {
    const length = sequenceWindow.length

    if (length % 2 === 1) {
      return Math.floor(length / 2)
    } else {
      return Math.floor(length / 2) - 1
    }
  }

  getModifiedResidues(d: any): string[] {
    const peptideSequences = this.isArray(d[this.dataService.differentialForm.peptideSequence]) 
      ? d[this.dataService.differentialForm.peptideSequence] 
      : [d[this.dataService.differentialForm.peptideSequence]]
    
    const positionsInPeptide = this.isArray(d[this.dataService.differentialForm.positionPeptide])
      ? d[this.dataService.differentialForm.positionPeptide]
      : [d[this.dataService.differentialForm.positionPeptide]]

    const residues: string[] = []
    
    for (let i = 0; i < peptideSequences.length; i++) {
      const peptide = peptideSequences[i]
      const position = positionsInPeptide[i] || positionsInPeptide[0] || 1
      if (peptide && position > 0 && position <= peptide.length) {
        residues.push(peptide[position - 1])
      }
    }
    
    return residues
  }

  renderPeptideWithHighlights(peptide: string, positionsInPeptide: number[]): {before: string, highlighted: string[], after: string, segments: Array<{text: string, isHighlighted: boolean}>} {
    if (!peptide || !positionsInPeptide || positionsInPeptide.length === 0) {
      return {before: peptide || '', highlighted: [], after: '', segments: [{text: peptide || '', isHighlighted: false}]}
    }

    // Sort positions to process them in order
    const sortedPositions = [...positionsInPeptide].sort((a, b) => a - b)
    const segments: Array<{text: string, isHighlighted: boolean}> = []
    let currentIndex = 0

    for (const position of sortedPositions) {
      const adjustedPosition = position - 1 // Convert to 0-based index
      
      if (adjustedPosition >= 0 && adjustedPosition < peptide.length) {
        // Add text before this highlighted position
        if (currentIndex < adjustedPosition) {
          segments.push({
            text: peptide.slice(currentIndex, adjustedPosition),
            isHighlighted: false
          })
        }
        
        // Add the highlighted amino acid
        segments.push({
          text: peptide[adjustedPosition],
          isHighlighted: true
        })
        
        currentIndex = adjustedPosition + 1
      }
    }
    
    // Add remaining text after last highlighted position
    if (currentIndex < peptide.length) {
      segments.push({
        text: peptide.slice(currentIndex),
        isHighlighted: false
      })
    }

    const highlighted = sortedPositions
      .filter(pos => pos > 0 && pos <= peptide.length)
      .map(pos => peptide[pos - 1])
    
    return {
      before: '',
      highlighted,
      after: '',
      segments
    }
  }
}

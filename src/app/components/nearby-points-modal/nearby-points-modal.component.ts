import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../data.service';
import { SettingsService } from '../../settings.service';
import { UniprotService } from '../../uniprot.service';

interface DataPoint {
  primaryId: string;
  geneName: string;
  foldChange: number;
  significance: number;
  distance: number;
  comparison: string;
  traceGroup: string;
  traceColor: string;
  text: string;
  residue: string;
  position: number | number[];
  sequenceWindow: string | string[];
  peptideSequence: string | string[];
  positionPeptide: number | number[];
  localizationScore: number;
  [key: string]: any;
}

@Component({
  selector: 'app-nearby-points-modal',
  templateUrl: './nearby-points-modal.component.html',
  styleUrls: ['./nearby-points-modal.component.scss'],
  standalone: false
})
export class NearbyPointsModalComponent {
  @Input() targetPoint: DataPoint | null = null;
  @Input() nearbyPoints: DataPoint[] = [];
  
  boundaryDistance: number = 1.0;
  maxPoints: number = 50;
  
  // Additional filtering options
  useFoldChangeFilter: boolean = false;
  foldChangeThreshold: number = 1.0;
  useSignificanceFilter: boolean = false;
  significanceThreshold: number = 0.05;
  
  // Selection functionality
  selectedPoints: Set<string> = new Set();
  includeTargetPoint: boolean = true;
  selectionName: string = '';
  existingSelections: string[] = [];
  addToExistingSelection: string = '';
  selectAllChecked: boolean = false;
  
  // Bar chart functionality
  expandedCharts: Set<string> = new Set();
  
  displayColumns = ['primaryId', 'geneName', 'foldChange', 'significance', 'traceGroup', 'distance'];

  constructor(
    public activeModal: NgbActiveModal,
    private dataService: DataService,
    private uniprot: UniprotService,
    private settings: SettingsService
  ) {}

  ngOnInit() {
    if (this.targetPoint) {
      this.recalculateNearbyPoints();
      // Generate default selection name
      this.selectionName = `Nearby ${this.targetPoint.geneName || this.targetPoint.primaryId}`;
    }
    
    // Get existing selections from dataService
    this.existingSelections = this.dataService.selectOperationNames || [];
  }

  recalculateNearbyPoints() {
    if (!this.targetPoint) return;

    const allPoints: DataPoint[] = [];
    const targetX = this.targetPoint.foldChange;
    const targetY = this.targetPoint.significance;

    // Process all data points to find nearby ones
    for (const row of this.dataService.currentDF) {
      const foldChange = row[this.dataService.differentialForm.foldChange];
      const significance = row[this.dataService.differentialForm.significant];
      const primaryId = row[this.dataService.differentialForm.primaryIDs];
      const comparison = row[this.dataService.differentialForm.comparison];
      
      // Skip the target point itself
      if (primaryId === this.targetPoint.primaryId && comparison === this.targetPoint.comparison) {
        continue;
      }

      // Calculate Euclidean distance
      const distance = Math.sqrt(Math.pow(foldChange - targetX, 2) + Math.pow(significance - targetY, 2));
      
      // Apply distance filter
      if (distance > this.boundaryDistance) {
        continue;
      }
      
      // Apply optional fold change filter (absolute value)
      if (this.useFoldChangeFilter && Math.abs(foldChange) < this.foldChangeThreshold) {
        continue;
      }
      
      // Apply optional significance filter (p-value, so lower is more significant)
      if (this.useSignificanceFilter) {
        const pValue = Math.pow(10, -significance); // Convert -log10(p) back to p-value
        if (pValue > this.significanceThreshold) {
          continue;
        }
      }
      
      // Point passes all filters, process it
      let geneName = '';
      let text = primaryId;
      
      // Get gene name from UniProt if available, otherwise from data
      if (this.dataService.fetchUniProt) {
        const accID = row[this.dataService.differentialForm.accession];
        const uniprotData = this.uniprot.getUniprotFromAcc(accID);
        if (uniprotData && uniprotData['Gene Names']) {
          geneName = uniprotData['Gene Names'];
        }
      } else if (this.dataService.differentialForm.geneNames !== '') {
        geneName = row[this.dataService.differentialForm.geneNames] || '';
      }
      
      if (geneName !== '') {
        text = geneName + '[' + primaryId + ']' + ' (' + comparison + ')';
      }

      // Determine trace group and color
      let traceGroup = 'Background';
      let traceColor = '#a4a2a2';
      
      if (this.dataService.selectedMap[primaryId]) {
        // For selected points, use the first group name (like volcano plot does)
        for (const groupName in this.dataService.selectedMap[primaryId]) {
          traceGroup = groupName;
          break;
        }
      } else if (!this.settings.settings.backGroundColorGrey) {
        const significanceGroup = this.dataService.significantGroup(foldChange, significance);
        traceGroup = significanceGroup[0];
      }

      // Get color from settings
      if (this.settings.settings.colorMap && this.settings.settings.colorMap[traceGroup]) {
        traceColor = this.settings.settings.colorMap[traceGroup];
      }

      const point: DataPoint = {
        primaryId,
        geneName,
        foldChange,
        significance,
        distance,
        comparison,
        traceGroup,
        traceColor,
        text,
        residue: this.getModifiedResidue(row) || '',
        position: row[this.dataService.differentialForm.position] || 0,
        sequenceWindow: row[this.dataService.differentialForm.sequence] || '',
        peptideSequence: row[this.dataService.differentialForm.peptideSequence] || '',
        positionPeptide: row[this.dataService.differentialForm.positionPeptide] || 0,
        localizationScore: row[this.dataService.differentialForm.score] || 0,
        ...row // Include all original data
      };

      allPoints.push(point);
    }

    // Sort by distance and limit results
    this.nearbyPoints = allPoints
      .sort((a, b) => a.distance - b.distance)
      .slice(0, this.maxPoints);
  }

  onBoundaryChange() {
    this.recalculateNearbyPoints();
  }

  onMaxPointsChange() {
    if (this.nearbyPoints.length > this.maxPoints) {
      this.nearbyPoints = this.nearbyPoints.slice(0, this.maxPoints);
    }
  }

  onFilterChange() {
    this.recalculateNearbyPoints();
  }

  getDisplayValue(point: DataPoint, column: string): any {
    const value = point[column];
    if (typeof value === 'number') {
      return parseFloat(value.toFixed(4));
    }
    return value || '';
  }

  selectPoint(point: DataPoint) {
    // Emit selection event similar to volcano plot selection
    this.activeModal.close({
      action: 'select',
      data: [point.primaryId],
      title: point.text
    });
  }

  annotatePoint(point: DataPoint) {
    // Emit annotation event
    this.activeModal.close({
      action: 'annotate',
      data: [point.primaryId]
    });
  }

  close() {
    this.activeModal.dismiss();
  }

  // Selection management methods
  togglePointSelection(primaryId: string) {
    if (this.selectedPoints.has(primaryId)) {
      this.selectedPoints.delete(primaryId);
    } else {
      this.selectedPoints.add(primaryId);
    }
  }

  isPointSelected(primaryId: string): boolean {
    return this.selectedPoints.has(primaryId);
  }

  selectAllPoints() {
    this.nearbyPoints.forEach(point => {
      this.selectedPoints.add(point.primaryId);
    });
  }

  clearSelection() {
    this.selectedPoints.clear();
  }

  onSelectAllChange() {
    if (this.selectAllChecked) {
      this.selectAllPoints();
    } else {
      this.clearSelection();
    }
  }

  createNewSelection() {
    if (!this.selectionName.trim()) {
      alert('Please enter a selection name');
      return;
    }

    const selectedIds: string[] = [];
    
    // Include target point if selected
    if (this.includeTargetPoint && this.targetPoint) {
      selectedIds.push(this.targetPoint.primaryId);
    }
    
    // Add selected nearby points
    this.selectedPoints.forEach(id => selectedIds.push(id));

    if (selectedIds.length === 0) {
      alert('Please select at least one point');
      return;
    }

    this.activeModal.close({
      action: 'createSelection',
      data: selectedIds,
      title: this.selectionName.trim()
    });
  }

  addToExisting() {
    if (!this.addToExistingSelection) {
      alert('Please select an existing selection to add to');
      return;
    }

    const selectedIds: string[] = [];
    
    // Include target point if selected
    if (this.includeTargetPoint && this.targetPoint) {
      selectedIds.push(this.targetPoint.primaryId);
    }
    
    // Add selected nearby points
    this.selectedPoints.forEach(id => selectedIds.push(id));

    if (selectedIds.length === 0) {
      alert('Please select at least one point');
      return;
    }

    this.activeModal.close({
      action: 'addToSelection',
      data: selectedIds,
      existingSelection: this.addToExistingSelection
    });
  }

  annotateSelectedPoints() {
    const selectedIds: string[] = [];
    
    // Include target point if selected
    if (this.includeTargetPoint && this.targetPoint) {
      selectedIds.push(this.targetPoint.primaryId);
    }
    
    // Add selected nearby points
    this.selectedPoints.forEach(id => selectedIds.push(id));

    if (selectedIds.length === 0) {
      alert('Please select at least one point to annotate');
      return;
    }

    this.activeModal.close({
      action: 'annotateMultiple',
      data: selectedIds
    });
  }

  // Bar chart methods
  toggleBarChart(primaryId: string) {
    if (this.expandedCharts.has(primaryId)) {
      this.expandedCharts.delete(primaryId);
    } else {
      this.expandedCharts.add(primaryId);
    }
  }

  isChartExpanded(primaryId: string): boolean {
    return this.expandedCharts.has(primaryId);
  }

  getRawDataForPoint(primaryId: string): any {
    // Find the raw data for this primary ID
    if (this.dataService.raw && this.dataService.raw.df && this.dataService.raw.df.count() > 0) {
      const rawData = this.dataService.raw.df.where(row => 
        row[this.dataService.rawForm.primaryIDs] === primaryId
      ).first();
      return rawData || null;
    }
    return null;
  }

  // PTM-specific helper methods (adapted from raw-data component)
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  getSequenceArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value;
    }
    return typeof value === 'string' ? value.split(';') : [];
  }

  getSequenceWindowCenter(sequenceWindow: string): number {
    const length = sequenceWindow.length;

    if (length % 2 === 1) {
      return Math.floor(length / 2);
    } else {
      return Math.floor(length / 2) - 1;
    }
  }

  getModifiedResidue(data: any): string {
    const peptideSequences = this.isArray(data[this.dataService.differentialForm.peptideSequence]) 
      ? data[this.dataService.differentialForm.peptideSequence] as string[]
      : [data[this.dataService.differentialForm.peptideSequence] as string];
    
    const positionsInPeptide = this.isArray(data[this.dataService.differentialForm.positionPeptide])
      ? data[this.dataService.differentialForm.positionPeptide] as number[]
      : [data[this.dataService.differentialForm.positionPeptide] as number];

    for (let i = 0; i < peptideSequences.length; i++) {
      const peptide = peptideSequences[i];
      const position = positionsInPeptide[i] || positionsInPeptide[0] || 1;
      if (peptide && position > 0 && position <= peptide.length) {
        return peptide[position - 1];
      }
    }
    
    return '';
  }

  getModifiedResidues(point: DataPoint): string[] {
    const peptideSequences = this.isArray(point.peptideSequence) 
      ? point.peptideSequence as string[]
      : [point.peptideSequence as string];
    
    const positionsInPeptide = this.isArray(point.positionPeptide)
      ? point.positionPeptide as number[]
      : [point.positionPeptide as number];

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

  // Helper methods for template type safety
  getPositionAsNumber(position: number | number[]): number {
    return Array.isArray(position) ? position[0] || 1 : position || 1;
  }

  getPositionAsArray(position: number | number[]): number[] {
    return Array.isArray(position) ? position : [position || 1];
  }

  getPeptideAsString(peptide: string | string[]): string {
    return Array.isArray(peptide) ? peptide[0] || '' : peptide || '';
  }

  renderPeptideWithHighlights(peptide: string, positionsInPeptide: number[]): {segments: Array<{text: string, isHighlighted: boolean}>} {
    if (!peptide || !positionsInPeptide || positionsInPeptide.length === 0) {
      return {segments: [{text: peptide || '', isHighlighted: false}]};
    }

    // Sort positions to process them in order
    const sortedPositions = [...positionsInPeptide].sort((a, b) => a - b);
    const segments: Array<{text: string, isHighlighted: boolean}> = [];
    let currentIndex = 0;

    for (const position of sortedPositions) {
      const adjustedPosition = position - 1; // Convert to 0-based index
      
      if (adjustedPosition >= 0 && adjustedPosition < peptide.length) {
        // Add text before this highlighted position
        if (currentIndex < adjustedPosition) {
          segments.push({
            text: peptide.slice(currentIndex, adjustedPosition),
            isHighlighted: false
          });
        }
        
        // Add the highlighted amino acid
        segments.push({
          text: peptide[adjustedPosition],
          isHighlighted: true
        });
        
        currentIndex = adjustedPosition + 1;
      }
    }
    
    // Add remaining text after last highlighted position
    if (currentIndex < peptide.length) {
      segments.push({
        text: peptide.slice(currentIndex),
        isHighlighted: false
      });
    }

    return { segments };
  }

  // Helper function to determine contrasting text color
  getContrastColor(backgroundColor: string): string {
    if (!backgroundColor) return '#000000';
    
    // Handle different color formats
    let color = backgroundColor.toLowerCase();
    let r = 0, g = 0, b = 0;
    
    if (color.startsWith('#')) {
      // Hex color
      color = color.substring(1);
      if (color.length === 3) {
        // Short hex format #RGB -> #RRGGBB
        r = parseInt(color.charAt(0) + color.charAt(0), 16);
        g = parseInt(color.charAt(1) + color.charAt(1), 16);
        b = parseInt(color.charAt(2) + color.charAt(2), 16);
      } else if (color.length === 6) {
        // Full hex format #RRGGBB
        r = parseInt(color.substring(0, 2), 16);
        g = parseInt(color.substring(2, 4), 16);
        b = parseInt(color.substring(4, 6), 16);
      }
    } else if (color.startsWith('rgb')) {
      // RGB format rgb(r, g, b) or rgba(r, g, b, a)
      const matches = color.match(/\d+/g);
      if (matches && matches.length >= 3) {
        r = parseInt(matches[0], 10);
        g = parseInt(matches[1], 10);
        b = parseInt(matches[2], 10);
      }
    }
    
    // Calculate relative luminance (WCAG formula)
    const rSRGB = r / 255;
    const gSRGB = g / 255;
    const bSRGB = b / 255;
    
    const rLinear = rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow((rSRGB + 0.055) / 1.055, 2.4);
    const gLinear = gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow((gSRGB + 0.055) / 1.055, 2.4);
    const bLinear = bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow((bSRGB + 0.055) / 1.055, 2.4);
    
    const luminance = 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
    
    // Return black for light backgrounds (luminance > 0.179), white for dark backgrounds
    return luminance > 0.179 ? '#000000' : '#ffffff';
  }
}
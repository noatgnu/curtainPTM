import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { WebService } from "../../web.service";
import { SettingsService } from "../../settings.service";
import { PlotlyThemeService } from "../../plotly-theme.service";
import { ThemeService } from "../../theme.service";
import { Subscription } from "rxjs";
import { ToastService } from "../../toast.service";

interface Domain {
  name: string;
  start: number;
  end: number;
  length: number;
  color?: string;
  visible: boolean;
}

type VisualizationType = 'waterfall' | 'segments';

@Component({
  selector: 'app-protein-domain-plot',
  templateUrl: './protein-domain-plot.component.html',
  styleUrls: ['./protein-domain-plot.component.scss'],
  standalone: false
})
export class ProteinDomainPlotComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;
  revision = 0;

  _data: any[] = [];
  geneName = "";
  proteinLength = 0;
  domains: Domain[] = [];
  filteredDomains: Domain[] = [];
  rawDomainData: any[] = [];

  loading = false;
  searchTerm = "";
  showOther = true;
  visualizationType: VisualizationType = 'segments';
  showSettings = true;
  showDomainList = false;
  selectedDomain: Domain | null = null;

  defaultColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
  ];

  config: any = {
    toImageButtonOptions: {
      format: 'svg',
      filename: 'protein-domain-plot',
      height: 400,
      width: 1000,
      scale: 1
    },
    responsive: true
  };

  layout: any = {};

  @Input() set data(value: any) {
    if (!value) return;

    this.loading = true;
    this.geneName = value["Gene Names"] || "Unknown";
    this.proteinLength = parseInt(value["Length"]) || 0;
    this.rawDomainData = value["Domain [FT]"] || [];

    this.processDomains();
    this.loading = false;
  }

  get data(): any[] {
    return this._data;
  }

  constructor(
    private web: WebService,
    public settings: SettingsService,
    private plotlyTheme: PlotlyThemeService,
    private themeService: ThemeService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(() => {
      this.updateLayout();
      this.revision++;
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private processDomains(): void {
    this.domains = [];
    let colorIndex = 0;

    for (const d of this.rawDomainData) {
      this.domains.push({
        name: d.name,
        start: d.start,
        end: d.end,
        length: d.end - d.start + 1,
        color: this.defaultColors[colorIndex % this.defaultColors.length],
        visible: true
      });
      colorIndex++;
    }

    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.domains];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(d => d.name.toLowerCase().includes(term));
    }

    filtered = filtered.filter(d => d.visible);

    this.filteredDomains = filtered;
    this.renderPlot();
  }

  private renderPlot(): void {
    if (this.visualizationType === 'segments') {
      this.renderSegmentsPlot();
    } else {
      this.renderWaterfallPlot();
    }
  }

  private renderSegmentsPlot(): void {
    const traces: any[] = [];

    traces.push({
      type: 'scatter',
      x: [0, this.proteinLength],
      y: [0, 0],
      mode: 'lines',
      line: { color: '#cccccc', width: 8 },
      hoverinfo: 'none',
      showlegend: false
    });

    const sortedDomains = [...this.filteredDomains].sort((a, b) => a.start - b.start);

    for (const domain of sortedDomains) {
      traces.push({
        type: 'scatter',
        x: [domain.start, domain.end],
        y: [0, 0],
        mode: 'lines',
        line: { color: domain.color, width: 20 },
        name: domain.name,
        hovertemplate: `<b>${domain.name}</b><br>Position: ${domain.start} - ${domain.end}<br>Length: ${domain.length} aa<extra></extra>`,
        showlegend: true
      });

      traces.push({
        type: 'scatter',
        x: [(domain.start + domain.end) / 2],
        y: [0],
        mode: 'text',
        text: [domain.name.length > 15 ? domain.name.substring(0, 12) + '...' : domain.name],
        textposition: 'middle center',
        textfont: { size: 9, color: 'white' },
        hoverinfo: 'none',
        showlegend: false
      });
    }

    this._data = traces;

    this.layout = {
      title: {
        text: `Protein Domains - ${this.geneName}`,
        font: { size: 16 }
      },
      xaxis: {
        title: '<b>Amino Acid Position</b>',
        range: [0, this.proteinLength],
        showgrid: true,
        gridcolor: 'rgba(128,128,128,0.2)',
        zeroline: false,
        tickfont: { size: 11 }
      },
      yaxis: {
        visible: false,
        range: [-0.5, 0.5],
        fixedrange: true
      },
      width: Math.min(1000, window.innerWidth - 100),
      height: 200,
      margin: { t: 50, b: 60, r: 50, l: 50 },
      showlegend: this.filteredDomains.length <= 10,
      legend: {
        orientation: 'h',
        y: -0.3,
        x: 0.5,
        xanchor: 'center',
        font: { size: 10 }
      },
      font: {
        family: this.settings.settings.plotFontFamily + ", serif"
      },
      hovermode: 'closest'
    };

    this.updateLayout();
    this.updateConfig();
    this.revision++;
  }

  private renderWaterfallPlot(): void {
    let last = 1;
    const waterfallPlot: any = {
      type: "waterfall",
      orientation: "h",
      measure: [],
      y: [],
      x: [],
      connector: { mode: "between" },
      text: [],
      hoverinfo: "text",
      base: 1,
      increasing: { marker: { color: '#1f77b4' } },
      decreasing: { marker: { color: '#1f77b4' } },
      totals: { marker: { color: '#1f77b4' } }
    };

    const sortedDomains = [...this.filteredDomains].sort((a, b) => a.start - b.start);

    for (const d of sortedDomains) {
      if (this.showOther && d.start - 1 > last) {
        waterfallPlot.measure.push("relative");
        waterfallPlot.y.push("Other");
        waterfallPlot.x.push(d.start - last);
        const startPos = last !== 1 ? last + 1 : 1;
        waterfallPlot.text.push(`${startPos} - ${d.start - 1}; Other (${d.start - last} aa)`);
        last = d.start - 1;
      }

      waterfallPlot.measure.push("relative");
      waterfallPlot.y.push(d.name);
      waterfallPlot.x.push(d.end - last);
      waterfallPlot.text.push(`${d.start} - ${d.end}; ${d.name} (${d.length} aa)`);
      last = d.end;
    }

    if (this.showOther && this.proteinLength - 1 > last) {
      waterfallPlot.measure.push("relative");
      waterfallPlot.y.push("Other");
      waterfallPlot.x.push(this.proteinLength - last);
      const startPos = last !== 1 ? last + 1 : 1;
      waterfallPlot.text.push(`${startPos} - ${this.proteinLength}; Other (${this.proteinLength - last} aa)`);
    }

    this._data = [waterfallPlot];

    const height = Math.max(300, 50 + waterfallPlot.y.length * 30);

    this.layout = {
      title: {
        text: `Protein Domains - ${this.geneName}`,
        font: { size: 16 }
      },
      yaxis: {
        type: "category",
        tickfont: { size: 11 },
        automargin: true
      },
      xaxis: {
        title: '<b>Amino Acid Position</b>',
        showgrid: true,
        gridcolor: 'rgba(128,128,128,0.2)',
        zeroline: false,
        tickfont: { size: 11 }
      },
      width: Math.min(1000, window.innerWidth - 100),
      height: height,
      margin: { t: 50, b: 50, r: 50, l: 175 },
      showlegend: false,
      font: {
        family: this.settings.settings.plotFontFamily + ", serif"
      }
    };

    this.updateLayout();
    this.updateConfig();
    this.revision++;
  }

  private updateLayout(): void {
    if (this.layout && Object.keys(this.layout).length > 0) {
      this.layout = this.plotlyTheme.applyThemeToLayout(this.layout);
    }
  }

  private updateConfig(): void {
    this.config = {
      toImageButtonOptions: {
        format: 'svg',
        filename: `protein-domains-${this.geneName}`,
        height: this.layout.height || 400,
        width: this.layout.width || 1000,
        scale: 1
      },
      responsive: true
    };
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onVisualizationChange(): void {
    this.renderPlot();
  }

  onShowOtherChange(): void {
    this.renderPlot();
  }

  toggleDomainVisibility(domain: Domain): void {
    domain.visible = !domain.visible;
    this.applyFilters();
  }

  selectAllDomains(): void {
    this.domains.forEach(d => d.visible = true);
    this.applyFilters();
  }

  deselectAllDomains(): void {
    this.domains.forEach(d => d.visible = false);
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = "";
    this.applyFilters();
  }

  selectDomain(domain: Domain): void {
    this.selectedDomain = this.selectedDomain === domain ? null : domain;
  }

  updateDomainColor(domain: Domain, color: string): void {
    domain.color = color;
    this.renderPlot();
  }

  downloadPlot(format: 'svg' | 'png'): void {
    this.web.downloadPlotlyImage(format, "domain", this.geneName + "domain").then();
  }

  exportCSV(): void {
    if (this.domains.length === 0) {
      this.toast.show("Export", "No domain data to export").then();
      return;
    }

    const headers = ['Domain Name', 'Start', 'End', 'Length (aa)', 'Coverage (%)'];
    const rows = this.domains.map(d => [
      d.name,
      d.start.toString(),
      d.end.toString(),
      d.length.toString(),
      ((d.length / this.proteinLength) * 100).toFixed(2)
    ]);

    const csvContent = [
      `# Protein: ${this.geneName}`,
      `# Length: ${this.proteinLength} aa`,
      `# Total Domains: ${this.domains.length}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `protein-domains-${this.geneName}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    this.toast.show("Export", "Domain data exported to CSV").then();
  }

  copyToClipboard(): void {
    if (this.domains.length === 0) {
      this.toast.show("Clipboard", "No domain data to copy").then();
      return;
    }

    const headers = ['Domain Name', 'Start', 'End', 'Length (aa)', 'Coverage (%)'];
    const rows = this.domains.map(d => [
      d.name,
      d.start.toString(),
      d.end.toString(),
      d.length.toString(),
      ((d.length / this.proteinLength) * 100).toFixed(2)
    ]);

    const text = [
      `Protein: ${this.geneName}`,
      `Length: ${this.proteinLength} aa`,
      `Total Domains: ${this.domains.length}`,
      '',
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      this.toast.show("Clipboard", "Domain data copied to clipboard").then();
    });
  }

  getTotalDomainCoverage(): number {
    if (this.proteinLength === 0) return 0;
    const totalLength = this.domains.reduce((sum, d) => sum + d.length, 0);
    return (totalLength / this.proteinLength) * 100;
  }

  getVisibleDomainCount(): number {
    return this.domains.filter(d => d.visible).length;
  }

  getLongestDomain(): Domain | null {
    if (this.domains.length === 0) return null;
    return this.domains.reduce((max, d) => d.length > max.length ? d : max, this.domains[0]);
  }

  getShortestDomain(): Domain | null {
    if (this.domains.length === 0) return null;
    return this.domains.reduce((min, d) => d.length < min.length ? d : min, this.domains[0]);
  }
}

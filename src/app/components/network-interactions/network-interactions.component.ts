import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DataService } from "../../data.service";
import { DbStringService } from "../../db-string.service";
import { InteractomeAtlasService } from "../../interactome-atlas.service";
import { DataFrame, fromCSV, IDataFrame } from "data-forge";
import { UniprotService } from "../../uniprot.service";
import { ScrollService } from "../../scroll.service";
import { getStringDBInteractions } from "curtain-web-api";
import { AccountsService } from "../../accounts/accounts.service";
import { FormBuilder, FormGroup } from "@angular/forms";
import { SettingsService } from "../../settings.service";
import { CytoplotComponent } from "../cytoplot/cytoplot.component";
import { ToastService } from "../../toast.service";
import { ThemeService } from "../../theme.service";

type LayoutType = 'cose' | 'circle' | 'grid' | 'breadthfirst' | 'concentric';
type EdgeSource = 'all' | 'stringdb' | 'interactome';

interface NetworkStats {
  totalNodes: number;
  geneNodes: number;
  ptmNodes: number;
  totalEdges: number;
  stringDbEdges: number;
  interactomeEdges: number;
  increasedNodes: number;
  decreasedNodes: number;
  significantNodes: number;
}

interface ScoreDefinition {
  key: string;
  label: string;
  description: string;
}

const SCORE_DEFINITIONS: ScoreDefinition[] = [
  { key: 'ascore', label: 'A-Score', description: 'Coexpression score (similar mRNA expression patterns)' },
  { key: 'dscore', label: 'D-Score', description: 'Database score (curated data from various databases)' },
  { key: 'escore', label: 'E-Score', description: 'Experimental score (affinity chromatography, etc.)' },
  { key: 'fscore', label: 'F-Score', description: 'Fusion score (fused proteins in other species)' },
  { key: 'nscore', label: 'N-Score', description: 'Neighborhood score (inter-gene nucleotide count)' },
  { key: 'pscore', label: 'P-Score', description: 'Cooccurrence score (similar absence/presence patterns)' },
  { key: 'tscore', label: 'T-Score', description: 'Textmining score (co-occurrence in abstracts)' }
];

@Component({
  selector: 'app-network-interactions',
  templateUrl: './network-interactions.component.html',
  styleUrls: ['./network-interactions.component.scss'],
  standalone: false
})
export class NetworkInteractionsComponent implements OnInit, OnDestroy {
  @ViewChild(CytoplotComponent) cytoplot: CytoplotComponent | undefined;

  scoreDefinitions = SCORE_DEFINITIONS;

  loading = false;
  loadingMessage = '';
  error = '';

  showSettings = true;
  showStringDbSettings = true;
  showInteractomeSettings = false;
  showColorSettings = false;

  edgeSourceFilter: EdgeSource = 'all';
  searchTerm = '';
  highlightedNodes: Set<string> = new Set();

  layoutType: LayoutType = 'cose';
  layoutOptions: { value: LayoutType; label: string }[] = [
    { value: 'cose', label: 'Force-Directed' },
    { value: 'circle', label: 'Circular' },
    { value: 'grid', label: 'Grid' },
    { value: 'breadthfirst', label: 'Hierarchical' },
    { value: 'concentric', label: 'Concentric' }
  ];

  networkStats: NetworkStats = {
    totalNodes: 0,
    geneNodes: 0,
    ptmNodes: 0,
    totalEdges: 0,
    stringDbEdges: 0,
    interactomeEdges: 0,
    increasedNodes: 0,
    decreasedNodes: 0,
    significantNodes: 0
  };

  get requiredScore(): number {
    return this._requiredScore;
  }

  set requiredScore(value: number) {
    if (value > 1) value = 1;
    this._requiredScore = value;
  }

  selection: string = "";
  otherScore: any = {
    ascore: 0,
    dscore: 0,
    escore: 0,
    fscore: 0,
    nscore: 0,
    pscore: 0,
    tscore: 0
  };

  get atlasScore(): number {
    return this._atlasScore;
  }

  set atlasScore(value: number) {
    if (value > 1) value = 1;
    this._atlasScore = value;
  }

  edgeDataViewer: any = {};
  edgeDataSource: string = "";
  showEdgePanel = false;

  private _requiredScore: number = 0.4;
  networkType: string = "functional";
  private _atlasScore: number = 0;
  _genes: string[] = [];
  nodes: any[] = [];
  currentGenes: any = {};
  edgeDataMap: any = {};
  styles: any[] = [];
  currentEdges: any = {};
  geneMap: any = {};
  previousMap: any = {};
  nodeClassMap: any = {};
  selectedData: IDataFrame = new DataFrame();
  selectedAccessions: string[] = [];

  @Input() set genes(value: string[]) {
    this.selectedData = this.data.currentDF.where(row => value.includes(row[this.data.differentialForm.primaryIDs])).bake();
    this.selectedAccessions = this.selectedData.getSeries(this.data.differentialForm.accession).distinct().bake().toArray();
    const genes: string[] = [];

    if (this.settings.settings.networkInteractionSettings === undefined) {
      this.settings.settings.networkInteractionSettings = {};
      for (const i in this.form.value) {
        this.settings.settings.networkInteractionSettings[i] = this.form.value[i];
        if (i in this.colorMap) {
          this.colorMap[i] = this.form.value[i].slice();
        }
      }
    } else {
      for (const i in this.colorMap) {
        if (!(i in this.settings.settings.networkInteractionSettings)) {
          this.settings.settings.networkInteractionSettings[i] = this.colorMap[i].slice();
        } else {
          this.form.controls[i].setValue(this.settings.settings.networkInteractionSettings[i]);
        }
      }
    }
    this.getGenes(this.selectedAccessions, genes).then();
  }

  private async getGenes(value: string[], genes: string[]) {
    if (this.uniprot.organism === undefined) {
      for (const v of value) {
        const uni = this.uniprot.getUniprotFromAcc(v);
        if (uni) {
          if (uni["Organism (ID)"]) {
            this.uniprot.organism = uni["Organism (ID)"];
            break;
          }
        }
      }
    }
    for (const v of value) {
      const uni: any = this.uniprot.getUniprotFromAcc(v);
      if (uni) {
        if (uni["Gene Names"] !== "") {
          genes.push(uni["Gene Names"]);
        }
      }
    }
    if (genes.length > 1) {
      const _genes: string[] = [];
      for (const v of genes) {
        const g = v.split(";")[0];
        if (g !== "") {
          if (!_genes.includes(g)) {
            _genes.push(g);
            this.geneMap[g] = v;
          }
        }
      }
      this._genes = _genes;

      if (this._genes.length > 1) {
        await this.getInteractions();
      }
    }
  }

  form: FormGroup = this.fb.group({
    ascore: [0],
    dscore: [0],
    escore: [0],
    fscore: [0],
    nscore: [0],
    pscore: [0],
    tscore: [0],
    atlasScore: [0],
    requiredScore: [0.4],
    networkType: ["functional"],
    "Increase": ["rgb(25,128,128)"],
    "Decrease": ["rgb(220,0,59)"],
    "StringDB": ["rgb(206,128,128)"],
    "No change": ["rgba(47,39,40,0.96)"],
    "Not significant": ["rgba(120,120,120,0.96)"],
    "Significant": ["rgba(180,50,150,0.96)"],
    "InteractomeAtlas": ["rgb(73,73,101)"]
  });

  colorMap: any = {
    "Increase": "rgb(25,128,128)",
    "Decrease": "rgb(220,0,59)",
    "StringDB": "rgb(206,128,128)",
    "No change": "rgba(47,39,40,0.96)",
    "Not significant": "rgba(120,120,120,0.96)",
    "Significant": "rgba(180,50,150,0.96)",
    "InteractomeAtlas": "rgb(73,73,101)"
  };

  result: any = { data: this.nodes.slice(), stylesheet: this.styles.slice(), id: 'networkInteractions' };

  constructor(
    private toast: ToastService,
    private fb: FormBuilder,
    public settings: SettingsService,
    private accounts: AccountsService,
    private scroll: ScrollService,
    private data: DataService,
    private dbString: DbStringService,
    private interac: InteractomeAtlasService,
    private uniprot: UniprotService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  async getInteractions() {
    this.loading = true;
    this.error = '';
    this.previousMap = {};

    if (this.cytoplot) {
      this.saveNetwork();
    }

    this.loadingMessage = 'Initializing network...';

    for (const i of this.settings.settings.networkInteractionData || []) {
      this.previousMap[i.data.id] = i;
    }

    if (!this.settings.settings.networkInteractionData) {
      this.settings.settings.networkInteractionData = [];
    }

    if (this.form.dirty) {
      for (const i in this.form.value) {
        this.settings.settings.networkInteractionSettings[i] = this.form.value[i];
      }
      this.form.markAsPristine();
    }

    this.styles = [...this.createStyles()];
    const nodes: any[] = [];
    this.currentEdges = {};
    this.currentGenes = {};
    this.nodeClassMap = {};
    let stringDbSuccess = false;
    let interactomeSuccess = false;
    const newNodes: any[] = [];

    this.networkStats = {
      totalNodes: 0,
      geneNodes: 0,
      ptmNodes: 0,
      totalEdges: 0,
      stringDbEdges: 0,
      interactomeEdges: 0,
      increasedNodes: 0,
      decreasedNodes: 0,
      significantNodes: 0
    };

    try {
      this.loadingMessage = 'Fetching StringDB interactions...';
      const result = await getStringDBInteractions(
        this._genes,
        this.uniprot.organism,
        this.form.value.requiredScore * 1000,
        this.form.value.networkType
      );
      const tempDF = fromCSV(<string>result.data);

      if (tempDF.count() > 0) {
        for (const r of tempDF) {
          let checked = true;
          for (const i in this.otherScore) {
            if (parseFloat(r[i]) < this.form.value[i]) {
              checked = false;
            }
          }
          if (checked) {
            r["preferredName_A"] = r["preferredName_A"].toUpperCase();
            r["preferredName_B"] = r["preferredName_B"].toUpperCase();
            const nodeName = "edge-stringdb-" + r["preferredName_A"] + r["preferredName_B"];

            if (!this.currentEdges[nodeName]) {
              this.edgeDataMap[nodeName] = r;
              let classes = "edge stringdb";

              if (this._genes.includes(r["preferredName_A"]) && this._genes.includes(r["preferredName_B"])) {
                this.currentEdges[nodeName] = true;
                this.networkStats.stringDbEdges++;

                if (this.previousMap[nodeName]) {
                  nodes.push(this.previousMap[nodeName]);
                } else {
                  newNodes.push({
                    data: {
                      id: nodeName,
                      source: "gene-" + r["preferredName_A"],
                      target: "gene-" + r["preferredName_B"],
                      score: r["score"]
                    },
                    classes: classes
                  });
                }
              }
            }

            if (this.geneMap[r["preferredName_A"]]) {
              this.currentGenes[r["preferredName_A"]] = true;
            }
            if (this.geneMap[r["preferredName_B"]]) {
              this.currentGenes[r["preferredName_B"]] = true;
            }
          }
        }
        stringDbSuccess = true;
      }
    } catch (e) {
      this.toast.show("Network", "Could not fetch StringDB data").then();
    }

    try {
      this.loadingMessage = 'Fetching Interactome Atlas data...';
      let resultInteractome = await this.accounts.curtainAPI.postInteractomeAtlasProxy(this._genes, "query_query");
      resultInteractome.data = JSON.parse(resultInteractome.data);

      if (resultInteractome.data["all_interactions"]?.length > 0) {
        for (const r of resultInteractome.data["all_interactions"]) {
          const score = parseFloat(r["score"]);
          let checked = score !== 0 || score >= this.form.value.atlasScore;

          if (checked) {
            r["interactor_A"]["protein_gene_name"] = r["interactor_A"]["protein_gene_name"].toUpperCase();
            r["interactor_B"]["protein_gene_name"] = r["interactor_B"]["protein_gene_name"].toUpperCase();
            const nodeName = "edge-interactome-" + r["interactor_A"]["protein_gene_name"] + r["interactor_B"]["protein_gene_name"];

            if (!this.currentEdges[nodeName]) {
              this.edgeDataMap[nodeName] = r;
              let classes = "edge interactome";

              if (this._genes.includes(r["interactor_A"]["protein_gene_name"]) &&
                  this._genes.includes(r["interactor_B"]["protein_gene_name"])) {
                this.currentEdges[nodeName] = true;
                this.networkStats.interactomeEdges++;

                if (this.previousMap[nodeName]) {
                  nodes.push(this.previousMap[nodeName]);
                } else {
                  newNodes.push({
                    data: {
                      id: nodeName,
                      source: "gene-" + r["interactor_A"]["protein_gene_name"],
                      target: "gene-" + r["interactor_B"]["protein_gene_name"],
                      score: r["score"]
                    },
                    classes: classes
                  });
                }
              }
            }

            if (this.geneMap[r["interactor_A"]["protein_gene_name"]]) {
              this.currentGenes[r["interactor_A"]["protein_gene_name"]] = true;
            }
            if (this.geneMap[r["interactor_B"]["protein_gene_name"]]) {
              this.currentGenes[r["interactor_B"]["protein_gene_name"]] = true;
            }
          }
        }
        interactomeSuccess = true;
      }
    } catch (e) {
      this.toast.show("Network", "Could not fetch Interactome Atlas data").then();
    }

    this.loadingMessage = 'Building network nodes...';

    for (const n in this.currentGenes) {
      this.networkStats.geneNodes++;
      const primaryIDs = this.data.getPrimaryFromGeneNames(this.geneMap[n]);
      let df = this.selectedData.where(r => primaryIDs.includes(r[this.data.differentialForm.primaryIDs])).bake();

      if (this.previousMap["gene-" + n]) {
        nodes.push(this.previousMap["gene-" + n]);
      } else {
        newNodes.push({
          data: { id: "gene-" + n, label: this.geneMap[n].split(";")[0], size: 2 },
          classes: "genes"
        });
      }

      df.forEach(r => {
        const nodeName = "uid-" + r[this.data.differentialForm.primaryIDs];
        const edgeName = "edge-" + nodeName + "-gene-" + n;

        if (this.previousMap[nodeName]) {
          nodes.push(this.previousMap[nodeName]);
        } else {
          let text = "";
          if (
            this.data.differentialForm.peptideSequence !== "" &&
            this.data.differentialForm.positionPeptide !== "" &&
            this.data.differentialForm.peptideSequence !== ""
          ) {
            const position = r[this.data.differentialForm.position];
            const positionInPeptide = r[this.data.differentialForm.positionPeptide];
            const peptide = r[this.data.differentialForm.peptideSequence];
            text = `${peptide[positionInPeptide - 1]}${position}`;
          } else {
            text = r[this.data.differentialForm.primaryIDs];
          }

          let uidClasses = "uid";
          if (r[this.data.differentialForm.foldChange] > 0 &&
              Math.abs(r[this.data.differentialForm.foldChange]) >= this.settings.settings.log2FCCutoff) {
            uidClasses += " increase";
            this.networkStats.increasedNodes++;
          } else if (r[this.data.differentialForm.foldChange] < 0 &&
                     Math.abs(r[this.data.differentialForm.foldChange]) >= this.settings.settings.log2FCCutoff) {
            uidClasses += " decrease";
            this.networkStats.decreasedNodes++;
          } else {
            uidClasses += " noChange";
          }

          if (r[this.data.differentialForm.significant] >= -Math.log10(this.settings.settings.pCutoff)) {
            uidClasses += " significant";
            this.networkStats.significantNodes++;
          } else {
            uidClasses += " not-significant";
          }

          this.nodeClassMap[nodeName] = uidClasses;
          this.networkStats.ptmNodes++;
          newNodes.push({ data: { id: nodeName, label: text, size: 1 }, classes: uidClasses });
        }

        if (this.previousMap[edgeName]) {
          nodes.push(this.previousMap[edgeName]);
        } else {
          newNodes.push({
            data: {
              id: edgeName,
              source: "gene-" + n,
              target: nodeName,
              score: r[this.data.differentialForm.foldChange]
            },
            classes: "edge"
          });
        }
      });
    }

    this.nodes = nodes.concat(newNodes);
    this.networkStats.totalNodes = this.networkStats.geneNodes + this.networkStats.ptmNodes;
    this.networkStats.totalEdges = this.networkStats.stringDbEdges + this.networkStats.interactomeEdges;

    const remove: any[] = this.settings.settings.networkInteractionData.filter(r => !nodes.includes(r));
    let fromBase = this.settings.settings.networkInteractionData.length > 0;

    this.result = {
      data: this.nodes.slice(),
      add: newNodes.slice(),
      stylesheet: this.styles.slice(),
      id: 'networkInteractions',
      remove: remove,
      fromBase: fromBase,
      enableCxtMenu: true
    };

    this.loading = false;
    this.loadingMessage = '';

    if (!stringDbSuccess && !interactomeSuccess) {
      this.error = 'Could not fetch interaction data from any source';
    } else {
      this.toast.show("Network", `Network updated: ${this.networkStats.totalNodes} nodes, ${this.networkStats.totalEdges} edges`).then();
    }
  }

  handleSelect(e: string) {
    if (e.startsWith("gene-")) {
      const gene = e.split("-");
      const primaryIDs = this.data.getPrimaryFromGeneNames(this.geneMap[gene[gene.length - 1]]);

      if (primaryIDs.length > 0) {
        const ind = this.data.selected.sort().indexOf(primaryIDs[0]);
        const newPage = Math.floor((ind + 1) / this.data.pageSize) + 1;

        if (this.data.page !== newPage) {
          this.data.page = newPage;
        }
        this.scroll.scrollToID(primaryIDs[0] + "scrollID");
      }
    } else if (e.startsWith("edge-")) {
      const edge = e.split("-");
      this.edgeDataViewer[edge[1]] = this.edgeDataMap[e];
      this.edgeDataSource = edge[1];
      this.showEdgePanel = true;
    }
  }

  handleSelection(e: string) {
    this.selection = e;
    this.getInteractions().then();
  }

  updateColor(color: string, key: string) {
    this.form.controls[key].setValue(color);
    this.form.markAsDirty();
  }

  createStyles() {
    const isDark = this.themeService.isDarkMode();
    const textColor = isDark ? "#f8f9fa" : "#212529";
    const textOutlineColor = isDark ? "#f8f9fa" : "rgb(16,10,10)";
    const nodeColor = isDark ? "rgba(77,171,247,0.96)" : "rgba(25,128,128,0.96)";

    const styles: any[] = [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "background-color": nodeColor,
          "color": textColor,
          "text-valign": "center",
          "text-halign": "center",
          "text-outline-width": "1px",
          "text-outline-color": textOutlineColor,
          "height": 20,
          "width": 20
        }
      },
      {
        selector: ".genes",
        style: {
          "content": "data(label)",
          "background-color": "rgba(139,0,220,0.96)",
          "color": textColor,
          "text-valign": "center",
          "text-halign": "center",
          "text-outline-width": "1px",
          "text-outline-color": textOutlineColor,
          "height": 20,
          "width": 20,
          "font-size": "6px",
          "font-family": "Arial, Helvetica, sans-serif"
        }
      },
      {
        selector: ".uid",
        style: {
          label: "data(label)",
          "background-color": "rgba(139,0,220,0.96)",
          "color": textColor,
          "text-valign": "center",
          "text-halign": "center",
          "text-outline-width": "1px",
          "text-outline-color": textOutlineColor,
          "height": 10,
          "width": 10,
          "font-size": "6px",
          "font-family": "Arial, Helvetica, sans-serif"
        }
      },
      {
        selector: ".increase",
        style: { "background-color": this.settings.settings.networkInteractionSettings["Increase"] }
      },
      {
        selector: ".decrease",
        style: { "background-color": this.settings.settings.networkInteractionSettings["Decrease"] }
      },
      {
        selector: ".noChange",
        style: { "background-color": this.settings.settings.networkInteractionSettings["No change"] }
      },
      {
        selector: ".significant",
        style: {
          "color": this.settings.settings.networkInteractionSettings["Significant"],
          "text-outline-color": isDark ? "#000000" : "#ffffff",
          "text-outline-width": "1px"
        }
      },
      {
        selector: ".not-significant",
        style: {
          "color": this.settings.settings.networkInteractionSettings["Not significant"],
          "text-outline-color": isDark ? "#000000" : "#ffffff",
          "text-outline-width": "1px"
        }
      },
      {
        selector: "edge",
        style: {
          "line-color": "rgba(25,128,128,0.66)",
          width: 1,
          "curve-style": "haystack"
        }
      },
      {
        selector: ".stringdb",
        style: { "line-color": this.settings.settings.networkInteractionSettings["StringDB"], width: 1 }
      },
      {
        selector: ".interactome",
        style: { "line-color": this.settings.settings.networkInteractionSettings["InteractomeAtlas"], width: 1 }
      },
      {
        selector: ".lrrk2",
        style: { "line-color": "rgb(73,73,101)", width: 1, "line-style": "solid" }
      },
      {
        selector: ".highlighted",
        style: {
          "border-width": 3,
          "border-color": "#ffc107",
          "background-color": "#ffc107"
        }
      },
      {
        selector: ".hidden",
        style: { "display": "none" }
      }
    ];

    return styles;
  }

  saveNetwork() {
    if (this.cytoplot) {
      this.settings.settings.networkInteractionData = this.cytoplot.saveJSON();
      this.toast.show("Network", "Network configuration saved").then();
    }
  }

  closeEdgePanel() {
    this.showEdgePanel = false;
    this.edgeDataSource = '';
  }

  onLayoutChange() {
    if (this.cytoplot) {
      this.cytoplot.runLayout(this.layoutType);
    }
  }

  fitToView() {
    if (this.cytoplot) {
      this.cytoplot.fit();
    }
  }

  zoomIn() {
    if (this.cytoplot) {
      this.cytoplot.zoomIn();
    }
  }

  zoomOut() {
    if (this.cytoplot) {
      this.cytoplot.zoomOut();
    }
  }

  onSearchChange() {
    this.highlightedNodes.clear();

    if (this.searchTerm.trim() && this.cytoplot) {
      const term = this.searchTerm.toLowerCase();
      for (const gene in this.geneMap) {
        if (gene.toLowerCase().includes(term) || this.geneMap[gene].toLowerCase().includes(term)) {
          this.highlightedNodes.add("gene-" + gene);
        }
      }
      this.cytoplot.highlightNodes(Array.from(this.highlightedNodes));
    } else if (this.cytoplot) {
      this.cytoplot.clearHighlights();
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.highlightedNodes.clear();
    if (this.cytoplot) {
      this.cytoplot.clearHighlights();
    }
  }

  onEdgeSourceFilterChange() {
    if (this.cytoplot) {
      this.cytoplot.filterEdges(this.edgeSourceFilter);
    }
  }

  downloadPNG() {
    if (this.cytoplot) {
      this.cytoplot.download('png');
    }
  }

  downloadSVG() {
    if (this.cytoplot) {
      this.cytoplot.download('svg');
    }
  }

  exportNodesCSV() {
    if (Object.keys(this.currentGenes).length === 0) {
      this.toast.show("Export", "No nodes to export").then();
      return;
    }

    const headers = ['Gene', 'Full Name', 'PTM Sites'];
    const rows: string[][] = [];

    for (const gene in this.currentGenes) {
      const primaryIDs = this.data.getPrimaryFromGeneNames(this.geneMap[gene]);
      const ptmCount = this.selectedData.where(r =>
        primaryIDs.includes(r[this.data.differentialForm.primaryIDs])
      ).count();

      rows.push([gene, this.geneMap[gene], ptmCount.toString()]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'network-genes.csv', 'text/csv');
    this.toast.show("Export", "Gene data exported to CSV").then();
  }

  exportEdgesCSV() {
    if (Object.keys(this.currentEdges).length === 0) {
      this.toast.show("Export", "No edges to export").then();
      return;
    }

    const headers = ['Source', 'Target', 'Database', 'Score'];
    const rows: string[][] = [];

    for (const edgeId in this.edgeDataMap) {
      if (!this.currentEdges[edgeId]) continue;

      const data = this.edgeDataMap[edgeId];
      let source = '', target = '', database = '', score = '';

      if (edgeId.includes('stringdb')) {
        source = data["preferredName_A"];
        target = data["preferredName_B"];
        database = 'StringDB';
        score = data["score"];
      } else if (edgeId.includes('interactome')) {
        source = data["interactor_A"]["protein_gene_name"];
        target = data["interactor_B"]["protein_gene_name"];
        database = 'Interactome Atlas';
        score = data["score"];
      }

      rows.push([source, target, database, score]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'network-edges.csv', 'text/csv');
    this.toast.show("Export", "Edges exported to CSV").then();
  }

  copyGenesToClipboard() {
    const genes = Object.keys(this.currentGenes);
    if (genes.length === 0) {
      this.toast.show("Clipboard", "No genes to copy").then();
      return;
    }

    navigator.clipboard.writeText(genes.join('\n')).then(() => {
      this.toast.show("Clipboard", `${genes.length} genes copied`).then();
    });
  }

  private downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type: type + ';charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  getTopConnectedGenes(limit: number = 5): { gene: string; connections: number }[] {
    const connectionCount: { [gene: string]: number } = {};

    for (const gene in this.currentGenes) {
      connectionCount[gene] = 0;
    }

    for (const edgeId in this.currentEdges) {
      if (!this.currentEdges[edgeId]) continue;

      const data = this.edgeDataMap[edgeId];
      let geneA = '', geneB = '';

      if (edgeId.includes('stringdb')) {
        geneA = data["preferredName_A"];
        geneB = data["preferredName_B"];
      } else if (edgeId.includes('interactome')) {
        geneA = data["interactor_A"]["protein_gene_name"];
        geneB = data["interactor_B"]["protein_gene_name"];
      }

      if (connectionCount[geneA] !== undefined) connectionCount[geneA]++;
      if (connectionCount[geneB] !== undefined) connectionCount[geneB]++;
    }

    return Object.entries(connectionCount)
      .map(([gene, connections]) => ({ gene, connections }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, limit);
  }
}

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../data.service";
import {DbStringService} from "../../db-string.service";
import {InteractomeAtlasService} from "../../interactome-atlas.service";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {UniprotService} from "../../uniprot.service";
import {ScrollService} from "../../scroll.service";
import {getInteractomeAtlas, getStringDBInteractions} from "curtain-web-api";
import {AccountsService} from "../../accounts/accounts.service";
import {FormBuilder, FormGroup} from "@angular/forms";
import {SettingsService} from "../../settings.service";
import {CytoplotComponent} from "../cytoplot/cytoplot.component";
import {ToastService} from "../../toast.service";

@Component({
  selector: 'app-network-interactions',
  templateUrl: './network-interactions.component.html',
  styleUrls: ['./network-interactions.component.scss']
})
export class NetworkInteractionsComponent implements OnInit {
  @ViewChild(CytoplotComponent) cytoplot: CytoplotComponent | undefined
  get requiredScore(): number {
    return this._requiredScore;
  }

  set requiredScore(value: number) {
    if (value > 1) {
      value = 1
    }
    this._requiredScore = value;
  }
  selection: string = ""
  otherScore: any = {
    ascore: 0,
    dscore: 0,
    escore: 0,
    fscore: 0,
    nscore: 0,
    pscore: 0,
    tscore: 0
  }

  get atlasScore(): number {
    return this._atlasScore;
  }

  set atlasScore(value: number) {
    if (value > 1) {
      value = 1
    }
    this._atlasScore = value;
  }

  edgeDataViewer: any = {}
  edgeDataSource: string = ""
  private _requiredScore: number = 0.4
  networkType: string = "functional"
  private _atlasScore: number = 0
  _genes: string[] = []
  nodes: any[] = []
  currentGenes: any = {}
  edgeDataMap: any = {}
  styles: any[] = this.createStyles()
  currentEdges: any = {}
  geneMap: any = {}
  previousMap: any = {}
  selectedData: IDataFrame = new DataFrame()
  selectedAccessions: string[] = []
  @Input() set genes(value: string[]) {
    this.selectedData = this.data.currentDF.where(row => value.includes(row[this.data.differentialForm.primaryIDs])).bake()
    this.selectedAccessions = this.selectedData.getSeries(this.data.differentialForm.accession).distinct().bake().toArray()
    const genes: string[] = []
    if (this.settings.settings.networkInteractionSettings === undefined) {
      this.settings.settings.networkInteractionSettings = {}
      for (const i in this.form.value) {
        this.settings.settings.networkInteractionSettings[i] = this.form.value[i]
        if (i in this.colorMap) {
          this.colorMap[i] = this.form.value[i].slice()
        }
      }
    } else {
      for (const i in this.settings.settings.networkInteractionSettings) {
        if (i in this.colorMap) {
          this.colorMap[i] = this.settings.settings.networkInteractionSettings[i].slice()
        }
        this.form.controls[i].setValue(this.colorMap[i])
      }
    }
    this.getGenes(this.selectedAccessions, genes).then();
  }

  private async getGenes(value: string[], genes: string[]) {
    if (this.uniprot.organism === undefined) {
      for (const v of value) {
        const uni = this.uniprot.getUniprotFromAcc(v)
        if (uni) {
          if (uni["Organism (ID)"]) {
            this.uniprot.organism = uni["Organism (ID)"]
            break
          }
        }
      }
    }
    for (const v of value) {
      const uni: any = this.uniprot.getUniprotFromAcc(v)
      if (uni) {
        if (uni["Gene Names"] !== "") {
          genes.push(uni["Gene Names"])
        }
      }
    }
    console.log(genes)
    if (genes.length > 1) {
      const _genes: string[] = []
      for (const v of genes) {
        const g = v.split(";")[0]
        if (g !== "") {
          if (!_genes.includes(g)) {
            _genes.push(g)
            this.geneMap[g] = v
          }
        }

      }
      this._genes = _genes

      if (this._genes.length > 1) {
        await this.getInteractions()
      }
    }
  }

  form: FormGroup = this.fb.group({
    ascore: [0,],
    dscore: [0,],
    escore: [0,],
    fscore: [0,],
    nscore: [0,],
    pscore: [0,],
    tscore: [0,],
    atlasScore: [0,],
    requiredScore: [0.4],
    networkType: ["functional"],
    "Increase": ["rgb(25,128,128)",],
    "Decrease": ["rgb(220,0,59)",],
    "StringDB": ["rgb(206,128,128)",],
    "No change": ["rgba(47,39,40,0.96)",],
    "Not significant": ["rgba(255,255,255,0.96)",],
    "Significant": ["rgba(252,107,220,0.96)",],
    "InteractomeAtlas": ["rgb(73,73,101)",],
  })

  colorMap: any = {
    "Increase": "rgb(25,128,128)",
    "Decrease": "rgb(220,0,59)",
    "StringDB": "rgb(206,128,128)",
    "No change": "rgba(47,39,40,0.96)",
    "Not significant": "rgba(255,255,255,0.96)",
    "Significant": "rgba(252,107,220,0.96)",
    "InteractomeAtlas": "rgb(73,73,101)",
  }

  result: any = {data: this.nodes.slice(), stylesheet: this.styles.slice(), id:'networkInteractions'}

  constructor(private toast: ToastService, private fb: FormBuilder, public settings: SettingsService, private accounts: AccountsService, private scroll: ScrollService, private data: DataService, private dbString: DbStringService, private interac: InteractomeAtlasService, private uniprot: UniprotService) {


  }

  ngOnInit(): void {
  }

  async getInteractions() {

    this.previousMap = {}
    if (this.cytoplot) {
      this.saveNetwork()
    }
    this.toast.show("Interaction network", "Getting interaction network").then()
    for (const i of this.settings.settings.networkInteractionData) {
      this.previousMap[i.data.id] = i
    }
    if (!this.settings.settings.networkInteractionData) {
      this.settings.settings.networkInteractionData = []
    }
    if (this.form.dirty) {
      for (const i in this.form.value) {
        this.settings.settings.networkInteractionSettings[i] = this.form.value[i]
      }
      this.styles = [...this.createStyles()]
      this.form.markAsPristine()
    }
    const nodes: any[] = []
    this.currentEdges = {}
    this.currentGenes = {}
    let result: any = {}
    let resultInteractome: any = {}
    const newNodes: any[] = []
    try {
      this.toast.show("Interaction network", "Getting StringDB data").then()
      result = await getStringDBInteractions(this._genes, this.uniprot.organism, this.form.value.requiredScore*1000, this.form.value.networkType)
      const tempDF = fromCSV(<string>result.data)
      if (tempDF.count() > 0) {
        console.log(tempDF.count())
        for (const r of tempDF) {
          let checked = true
          for (const i in this.otherScore) {
            if (parseFloat(r[i]) < this.form.value[i]) {
              checked = false
            }
          }
          if (checked) {
            r["preferredName_A"] = r["preferredName_A"].toUpperCase()
            r["preferredName_B"] = r["preferredName_B"].toUpperCase()
            const nodeName = "edge-stringdb-"+r["preferredName_A"]+r["preferredName_B"]
            if (!this.currentEdges[nodeName]) {
              this.edgeDataMap[nodeName] = r
              let classes = "edge stringdb"
              if (this._genes.includes(r["preferredName_A"])&&this._genes.includes(r["preferredName_B"])) {
                this.currentEdges[nodeName] = true
                if (this.previousMap[nodeName]) {
                  nodes.push(this.previousMap[nodeName])
                } else {
                  newNodes.push(
                    {data:
                        {
                          id: nodeName,
                          source: "gene-"+ r["preferredName_A"],
                          target: "gene-"+ r["preferredName_B"],
                          score: r["score"]
                        }, classes: classes
                    }
                  )
                }

              }
            }
            if (this.geneMap[r["preferredName_A"]]) {
              this.currentGenes[r["preferredName_A"]] = true
            }
            if (this.geneMap[r["preferredName_B"]]) {
              this.currentGenes[r["preferredName_B"]] = true
            }
          }

        }
      }
    } catch (e) {
      console.log("Can't get StringDB data")
    }
    try {
      //const resultInteractome = await getInteractomeAtlas(this._genes, "query_query")
      this.toast.show("Interaction network", "Getting Interactome Atlas data").then()
      let resultInteractome = await this.accounts.curtainAPI.postInteractomeAtlasProxy(this._genes, "query_query")
      resultInteractome.data = JSON.parse(resultInteractome.data)
      if (resultInteractome.data["all_interactions"]) {
        if (resultInteractome.data["all_interactions"].length > 0) {
          for (const r of resultInteractome.data["all_interactions"]) {
            const score = parseFloat(r["score"])
            let checked = false
            if (score !== 0) {
              checked = true
            } else if (score >= this.form.value.atlasScore) {
              checked = true
            }
            if (checked) {
              r["interactor_A"]["protein_gene_name"] = r["interactor_A"]["protein_gene_name"].toUpperCase()
              r["interactor_B"]["protein_gene_name"] = r["interactor_B"]["protein_gene_name"].toUpperCase()
              const nodeName = "edge-interactome-"+r["interactor_A"]["protein_gene_name"]+r["interactor_B"]["protein_gene_name"]
              if (!this.currentEdges[nodeName]) {
                this.edgeDataMap[nodeName] = r
                let classes = "edge interactome"
                if (this._genes.includes(r["interactor_A"]["protein_gene_name"])&&this._genes.includes(r["interactor_B"]["protein_gene_name"])){

                  this.currentEdges[nodeName] = true
                  if (this.previousMap[nodeName]) {
                    nodes.push(this.previousMap[nodeName])
                  } else {
                    newNodes.push(
                      {data:
                          {
                            id: nodeName,
                            source: "gene-"+r["interactor_A"]["protein_gene_name"],
                            target: "gene-"+r["interactor_B"]["protein_gene_name"],
                            score: r["score"]
                          }, classes: classes
                      }
                    )
                  }

                }
              }
              if (this.geneMap[r["interactor_A"]["protein_gene_name"]]) {
                this.currentGenes[r["interactor_A"]["protein_gene_name"]] = true
              }
              if (this.geneMap[r["interactor_B"]["protein_gene_name"]]) {
                this.currentGenes[r["interactor_B"]["protein_gene_name"]] = true
              }
            }
          }
        }
      }
    } catch (e) {
      console.log("Can't get Interactome Atlas")
    }

    for (const n in this.currentGenes) {
      const primaryIDs = this.data.getPrimaryFromGeneNames(this.geneMap[n])
      let df = this.selectedData.where(r => primaryIDs.includes(r[this.data.differentialForm.primaryIDs])).bake()
      if (this.previousMap["gene-"+n]) {
        nodes.push(this.previousMap["gene-"+n])
      } else {
        newNodes.push({data: {id: "gene-"+n, label: this.geneMap[n].split(";")[0], size: 2}, classes: "genes"})
      }
      df.forEach(r => {
        const nodeName = "uid-"+r[this.data.differentialForm.primaryIDs]
        const edgeName = "edge-"+nodeName+"-gene-"+n
        if (this.previousMap[nodeName]) {
          nodes.push(this.previousMap[nodeName])
        } else {
          let text = ""
          if (
            this.data.differentialForm.peptideSequence !== "" &&
            this.data.differentialForm.positionPeptide !== "" &&
            this.data.differentialForm.peptideSequence !== ""
          ) {
            const position = r[this.data.differentialForm.position]
            const positionInPeptide = r[this.data.differentialForm.positionPeptide]
            const peptide = r[this.data.differentialForm.peptideSequence]
            text = `${peptide[positionInPeptide-1]}${position}`
          } else  {
            text = r[this.data.differentialForm.primaryIDs]
          }
          let uidClasses = "uid"
          if (
            r[this.data.differentialForm.foldChange] > 0 &&
            Math.abs(r[this.data.differentialForm.foldChange]) >= this.settings.settings.log2FCCutoff) {
            uidClasses = uidClasses + " increase"
          } else if (r[this.data.differentialForm.foldChange] < 0 && Math.abs(r[this.data.differentialForm.foldChange]) >= this.settings.settings.log2FCCutoff) {
            uidClasses = uidClasses + " decrease"
          } else {
            uidClasses = uidClasses + " noChange"
          }
          if (r[this.data.differentialForm.significant] >= -Math.log10(this.settings.settings.pCutoff)) {
            uidClasses = uidClasses + " significant"
          } else {
            uidClasses = uidClasses + " not-significant"
          }
          newNodes.push({data: {id: nodeName, label: text, size: 1}, classes: uidClasses})
        }
        if (this.previousMap[edgeName]) {
          nodes.push(this.previousMap[edgeName])
        } else {
          newNodes.push(
            {data:
                {
                  id: edgeName,
                  source: "gene-"+n,
                  target: nodeName,
                  score: r[this.data.differentialForm.foldChange]
                }, classes: "edge"
            }
          )
        }
      })

    }


    this.nodes = nodes.concat(newNodes)
    const remove: any[] = this.settings.settings.networkInteractionData.filter(r => !nodes.includes(r))

    let fromBase: boolean = false
    if (this.settings.settings.networkInteractionData.length > 0) {
      fromBase = true
    }
    this.toast.show("Interaction network", `Adding ${newNodes.length} objects while removing ${remove.length} objects`).then()
    this.result = {data: this.nodes.slice(), add: newNodes.slice(), stylesheet: this.styles.slice(), id:'networkInteractions', remove: remove, fromBase: fromBase, enableCxtMenu: true}
  }

  handleSelect(e: string) {
    if (e.startsWith("gene-")) {
      const gene = e.split("-")
      const primaryIDs = this.data.getPrimaryFromGeneNames(this.geneMap[gene[gene.length-1]])

      if (primaryIDs.length > 0) {
        const ind = this.data.selected.sort().indexOf(primaryIDs[0])
        const newPage = Math.floor((ind + 1)/ this.data.pageSize) + 1

        if (this.data.page !== newPage) {
          this.data.page = newPage
        }
        this.scroll.scrollToID(primaryIDs[0]+"scrollID")
      }
    } else if (e.startsWith("edge-")) {
      const edge = e.split("-")
      this.edgeDataViewer[edge[1]] = this.edgeDataMap[e]
      this.edgeDataSource = edge[1]

    }
  }

  handleSelection(e: string) {
    this.selection = e
    this.getInteractions().then()
  }

  updateColor(color: string, key: string) {
    this.form.controls[key].setValue(color)
    this.form.markAsDirty()
  }

  createStyles() {
    return [
      {
        selector: "node", style: {
          label: "data(label)",
          "background-color": "rgba(25,128,128,0.96)",
          "color": "#fffffe",
          "text-valign": "center",
          "text-halign": "center",
          "text-outline-width": "1px",
          "text-outline-color": "rgb(16,10,10)",
          "height": 20,
          "width": 20,
        }
      },
      {
        selector: ".genes", style: {
          //label: "data(label)",
          "content": "data(label)",
          "background-color": "rgba(139,0,220,0.96)",
          "color": "#fffffe",
          "text-valign": "center",
          "text-halign": "center",
          "text-outline-width": "1px",
          "text-outline-color": "rgb(16,10,10)",
          "height": 20,
          "width": 20,
          "font-size": "6px",
          "font-family": "Arial, Helvetica, sans-serif",
        }
      },
      {
        selector: ".uid",
        style: {
          label: "data(label)",
          "background-color": "rgba(139,0,220,0.96)",
          "color": "#fffffe",
          "text-valign": "center",
          "text-halign": "center",
          "text-outline-width": "1px",
          "text-outline-color": "rgb(16,10,10)",
          "height": 10,
          "width": 10,
          "font-size": "6px",
          "font-family": "Arial, Helvetica, sans-serif",
        }
      },
      {
        selector: ".increase", style: {
          "background-color": this.settings.settings.networkInteractionSettings["Increase"]
        }
      },
      {
        selector: ".decrease", style: {
          "background-color": this.settings.settings.networkInteractionSettings["Decrease"]
        }
      },
      {
        selector: ".noChange", style: {
          "background-color": this.settings.settings.networkInteractionSettings["No change"]
        }
      },
      {
        selector: ".significant", style: {
          "color": this.settings.settings.networkInteractionSettings["Significant"]
        }
      },
      {
        selector: ".not-significant", style: {
          "color": this.settings.settings.networkInteractionSettings["Not significant"]
        }
      },
      {
        selector: "edge",
        style: {
          "line-color": "rgba(25,128,128,0.66)",
          width: 1,
          "curve-style": "haystack",
          //'line-style': 'dashed'
        }
      },
      {
        selector: ".stringdb",
        style: {"line-color": this.settings.settings.networkInteractionSettings["StringDB"], width: 1}
      },
      {
        selector: ".interactome",
        style: {"line-color": this.settings.settings.networkInteractionSettings["InteractomeAtlas"], width: 1}
      },
      {
        selector: ".lrrk2",
        style: {"line-color": "rgb(73,73,101)", width: 1, "line-style": "solid"}
      },

    ]
  }

  saveNetwork() {
    if (this.cytoplot) {
      this.settings.settings.networkInteractionData = this.cytoplot.saveJSON()
      this.toast.show("Interaction network", "Updated network data").then()
    }
  }
}

import { Injectable } from '@angular/core';
import {CurtainLink} from "./classes/curtain-link";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {PlotlyService} from "angular-plotly.js";
import {GlyconnectService} from "./glyconnect.service";
import {PspService} from "./psp.service";
import {PlmdService} from "./plmd.service";
import {CarbonyldbService} from "./carbonyldb.service";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  siteProperties: any = {
    non_user_post: true
  }
  links = new CurtainLink()
  filters: any = {
    Kinases: {filename: "kinases.txt", name: "Kinases"},
    LRRK2: {filename: "lrrk2.txt", name: "LRRK2 Pathway"},
    Phosphatases: {filename: "phosphatases.txt", name: "Phosphatases"},
    PD: {filename: "pd.txt", name: "PD Genes (Mendelian)"},
    PINK1: {filename: "pink1.txt", name: "PINK1 Pathway"},
    PDGWAS: {filename: "pd.gwas.txt", name: "PD Genes (GWAS)"},
    DUBS: {filename: "dubs.txt", name: "Deubiquitylases (DUBs)"},
    E1_E2_E3Ligase: {filename: "e3ligase.txt", name: "E1, E2, E3 Ligases"},
    AD: {filename: "AD.txt", name: "AD Genes"},
    Mito: {filename: "Mito.txt", name: "Mitochondrial Proteins"},
    Golgi: {filename: "Golgi.txt", name: "Golgi Proteins"},
    Lysosome: {filename: "Lysosome.txt", name: "Lysosomal Proteins"},
    Glycosylation: {filename: "glyco.txt", name: "Glycosylation Proteins"},
    Metabolism: {filename: "metabolism.txt", name: "Metabolism Pathway"},
    Cathepsins: {filename: "cathepsins.txt", name: "Cathepsins"},
    MacrophageLRRK2Inhibition: {filename: "macrophages.lrrk2.inhibition.txt", name: "LRRK2 inhibition in iPSC-derived macrophages"},
    CiliaCore: {filename: "cilia.core.txt", name: "Core Cilia Proteins"},
    CiliaExpanded: {filename: "cilia.expanded.txt", name: "Expanded Cilia Proteins"},
    mTOR: {filename: "mtor.txt", name: "mTOR Pathway"}
  }
  constructor(private http: HttpClient, private plotly: PlotlyService) { }

  async getFilter(categoryName: string) {
    if (this.filters[categoryName]) {
      const res = await this.http.get("assets/proteinLists/" + this.filters[categoryName].filename, {observe: "body", responseType: "text"}).toPromise()
      if (res) {
        return res
      }
    }
    return ""
  }

  replacer(key: any, value: any) {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
      };
    } else {
      return value;
    }
  }

  reviver(key: any, value: any) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }

  toParamString(options: Map<string, string>): string {
    const pArray: string[] = [];
    options.forEach((value, key) => {
      pArray.push(encodeURI(key + '=' + value));
    });

    return pArray.join('&');
  }

  async getProteomicsData(acc: string, tissueType: string) {
    //this.toast.show("Proteomics DB", "Fetching Proteomics DB data")
    return this.http.get(
      "https://www.proteomicsdb.org//proteomicsdb/logic/api/proteinexpression.xsodata/InputParams(PROTEINFILTER='" +acc+"',MS_LEVEL=1,TISSUE_ID_SELECTION='',TISSUE_CATEGORY_SELECTION='"+tissueType+"',SCOPE_SELECTION=1,GROUP_BY_TISSUE=1,CALCULATION_METHOD=0,EXP_ID=-1)/Results?$select=UNIQUE_IDENTIFIER,TISSUE_ID,TISSUE_NAME,TISSUE_SAP_SYNONYM,SAMPLE_ID,SAMPLE_NAME,AFFINITY_PURIFICATION,EXPERIMENT_ID,EXPERIMENT_NAME,EXPERIMENT_SCOPE,EXPERIMENT_SCOPE_NAME,PROJECT_ID,PROJECT_NAME,PROJECT_STATUS,UNNORMALIZED_INTENSITY,NORMALIZED_INTENSITY,MIN_NORMALIZED_INTENSITY,MAX_NORMALIZED_INTENSITY,SAMPLES&$format=json",
      {responseType: "json", observe: "body"}
    )
  }
  putSettings(settings: any, enable: boolean = true, description: string = "") {
    let form = new FormData()
    form.append("file", new Blob([JSON.stringify(settings, this.replacer)], {type: 'text/json'}), "curtainptm-settings.json")
    if (enable) {
      form.append("enable", "True")
    } else {
      form.append("enable", "False")
    }
    form.append("description", description)
    form.append("curtain_type", "PTM")
    return this.http.post(this.links.proxyURL + "curtain/", form, {responseType: "json", observe: "response"})
  }


  postSettings(id: string, token: string) {
    return this.http.get(this.links.proxyURL +`curtain/${id}/download/token=${token}/`, {responseType: "text", observe: "response"})
  }

  downloadFile(fileName: string, fileContent: string) {
    const blob = new Blob([fileContent], {type: 'text/csv'})
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url)
  }

  async downloadPlotlyImage(format: string, filename: string, id: string) {
    const graph = this.plotly.getInstanceByDivId(id)
    const plot = await this.plotly.getPlotly()
    await plot.downloadImage(graph, {format: format, filename: filename})
  }

  postNetphos(id: string, seq: string) {
    let headers = new HttpHeaders()
    headers = headers.append("content-type", "application/json")
    return this.http.post(this.links.proxyURL + "netphos/", JSON.stringify({id: id, fasta: ">"+id+"\n"+ seq}), {responseType: "json", observe: "response", headers})
  }

  getKinase(id: string) {
    return this.http.get("http://klifs.net/api_v2/kinase_ID?kinase_name=" + id, {responseType: "json", observe: "body", headers: {accept: "application/json"}})
  }

  getUniProtNew(acc: string) {
    return this.http.get("https://rest.uniprot.org/uniprotkb/"+acc+".json", {headers: {accept: "application/json"}, responseType: "json", observe: "body"})
  }



  generateTemporarySession(link_id: string, lifetime: number) {
    return this.http.post(this.links.proxyURL + `curtain/${link_id}/generate_token/`, {lifetime}, {responseType: "json", observe: "body"})
  }

}

import { Injectable } from '@angular/core';
import {GlyconnectService} from "./glyconnect.service";
import {PspService} from "./psp.service";
import {PlmdService} from "./plmd.service";
import {CarbonyldbService} from "./carbonyldb.service";

@Injectable({
  providedIn: 'root'
})
export class PtmService {
  databases: any[] = [
    {name:"PhosphoSite Plus (Phosphorylation)", value:"PSP_PHOSPHO", academic:true},
    {name:"PhosphoSite Plus (Ubiquitylation)", value:"PSP_UBI", academic:true},
    {name:"PhosphoSite Plus (Acetylation)", value:"PSP_ACETYL", academic:true},
    {name:"PhosphoSite Plus (Methylation)", value:"PSP_METHYL", academic:true},
    {name:"PhosphoSite Plus (Sumoylation)", value:"PSP_SUMOY", academic:true},
    {name:"PLMD (Ubiquitylation)", value:"PLMD_UBI", academic:true},
    {name:"PLMD (Methylation)", value:"PLMD_METHYL", academic:true},
    {name:"PLMD (Acetylation)", value:"PLMD_ACETYL", academic:true},
    {name:"CarbonylDB (Carbonylation)", value:"CDB_CARBONYL", academic:true},
    {name:"GLYCONNECT (N-Linked)", value:"GLYCONNECTN", academic:true},
    {name:"GLYCONNECT (O-Linked)", value:"GLYCONNECTO", academic:true}
  ]
  databaseNameMap: any = {}

  ptmDiseaseMap: Map<string, any> = new Map<string, any>()
  constructor(private glyconnect: GlyconnectService, private psp: PspService, private plmd: PlmdService, private carbonyl: CarbonyldbService) {
    for (const db of this.databases) {
      this.databaseNameMap[db.name] = db.value
    }
  }

  getDatabase(name: string) {
    switch (name) {
      case "PSP_PHOSPHO":
        this.psp.getPSP()
        break
      case "PLMD_UBI":
        this.plmd.getPLMD()
        break
      case "CDB_CARBONYL":
        this.carbonyl.getCarbonylDB()
        break
      default:
        break
    }
  }

  accessDB(name: string) {
    switch (name) {
      case "PSP_PHOSPHO":
        return this.psp.pspMap
      case "PSP_ACETYL":
        return this.psp.acetylPSPMap
      case "PSP_SUMOY":
        return this.psp.sumoylationPSPMap
      case "PSP_METHYL":
        return this.psp.methylationPSPMap
      case "PSP_UBI":
        return this.psp.ubiPSPMap
      case "PLMD_UBI":
        return this.plmd.plmdMap
      case "PLMD_METHYL":
        return this.plmd.methylPLMDMap
      case "PLMD_ACETYL":
        return this.plmd.acetylPLMDMap
      case "CDB_CARBONYL":
        return this.carbonyl.carbonylMap
      case "GLYCONNECTN":
        return this.glyconnect.glyconnectNMap
      case "GLYCONNECTO":
        return this.glyconnect.glyconnectOMap
      default:
        break
    }
  }

  async getGlyco(acc: string) {
    const result = await this.glyconnect.getGlyconnect(acc).toPromise()
    // @ts-ignore
    if (result["results"]) {
      const tempStore: any = {}
      // @ts-ignore
      for (const r of result["results"]) {
        if (r["site"]) {
          const res = r["site"]["location"]-1
          if (!tempStore[r["structure"]["glycan_type"]]) {
            tempStore[r["structure"]["glycan_type"]] = {}
          }
          if (!tempStore[r["structure"]["glycan_type"]][res]) {
            tempStore[r["structure"]["glycan_type"]][res] = {position: res, residue: "", description: r["structure"]["glycan_type"]}
          }
        }
      }
      if ("N-Linked" in tempStore) {
        if (!this.accessDB("GLYCONNECTN")[acc]) {
          this.accessDB("GLYCONNECTN")[acc] = []
          for (const i in tempStore["N-Linked"]) {
            this.accessDB("GLYCONNECTN")[acc].push(tempStore["N-Linked"][i])
          }
        }
      }
      if ("O-Linked" in tempStore) {
        if (!this.accessDB("GLYCONNECTO")[acc]) {
          this.accessDB("GLYCONNECTO")[acc] = []
          for (const i in tempStore["O-Linked"]) {
            this.accessDB("GLYCONNECTO")[acc].push(tempStore["O-Linked"][i])
          }
        }
      }
    }
  }


  getPTMDiseases(acc: string) {

  }
}

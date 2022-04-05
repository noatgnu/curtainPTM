import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {CurtainLink} from "../app/classes/curtain-link";
import {PspService} from "./psp.service";
import {PlmdService} from "./plmd.service";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  links: CurtainLink = new CurtainLink()
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

  constructor(private http: HttpClient, private psp: PspService, private plmd: PlmdService) { }

  putSettings(settings: any) {
    return this.http.put(this.links.proxyURL + "file_data", JSON.stringify(settings, this.replacer), {responseType: "text", observe: "response"})
  }

  postSettings(id: string, password: string) {
    return this.http.post(this.links.proxyURL +"file_data", JSON.stringify({id: id, password: password}), {responseType: "text", observe: "response"})
  }

  postNetphos(id: string, seq: string) {
    return this.http.post(this.links.proxyURL + "netphos/predict", JSON.stringify({id: id, fasta: ">"+id+"\n"+ seq}), {responseType: "json", observe: "response"})
  }

  getDatabase(name: string) {
    switch (name) {
      case "PSP_PHOSPHO":
        this.psp.getPSP()
        break
      case "PLMD_UBI":
        this.plmd.getPLMD()
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
      default:
        break
    }
  }
}

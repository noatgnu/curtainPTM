import { Injectable } from '@angular/core';
import {CurtainLink} from "./classes/curtain-link";
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class KinaseLibraryService {
  links = new CurtainLink()
  constructor(private http: HttpClient) { }

  get_kinase(entry: string, residue: string|undefined = undefined, position: number|undefined = undefined) {
    let params = new HttpParams()
    params = params.append("entry", entry)
    if (residue) {
      params = params.append("residue", residue)
    }

    if (position) {
      params = params.append("position", position)
    }

    return this.http.get(this.links.proxyURL + "kinase_library/", {responseType: "json", observe: "body", params})
  }

  getKinaseLibrary(sequence: string) {
    return this.http.get(this.links.proxyURL +  `kinase_library_proxy/?sequence=${sequence}`, {responseType: "json", observe: "body"})
  }
}

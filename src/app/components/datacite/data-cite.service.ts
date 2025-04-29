import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {RORQuery} from "./rorquery";
import {FunderQuery} from "./funder";

@Injectable({
  providedIn: 'root'
})
export class DataciteService {

  constructor(private http: HttpClient) { }

  getROR(identifier: string) {
    return this.http.get<RORQuery>("https://api.ror.org/organizations?query="+identifier, {responseType: "json", observe: "body"})
  }

  getFunder(identifier: string) {
    return this.http.get<FunderQuery>("https://api.crossref.org/funders?query="+identifier, {responseType: "json", observe: "body"})
  }

}

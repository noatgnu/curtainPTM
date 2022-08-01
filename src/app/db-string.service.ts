import { Injectable } from '@angular/core';
import {WebService} from "./web.service";
import {HttpClient} from "@angular/common/http";
import {UniprotService} from "./uniprot.service";

@Injectable({
  providedIn: 'root'
})
export class DbStringService {

  constructor(private web: WebService, private http: HttpClient) { }

  getStringDBInteractions(genes: string[], organism: string, score: number = 400, networkType: string = "functional") {
    const options: Map<string, string> = new Map<string, string>([
        ["identifiers", genes.join("%0d")],
        ["required_score", score.toString()],
        ["species", organism],
        ["netwrk_type", networkType]
      ]
    )
    return this.http.get("https://string-db.org/api/tsv/network?" + this.web.toParamString(options), {responseType: "text", observe: "body"})
  }
}

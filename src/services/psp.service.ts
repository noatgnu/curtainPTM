import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";

@Injectable({
  providedIn: 'root'
})
export class PspService {
  pspData: IDataFrame = new DataFrame()
  pspMap: any = {}

  constructor(private http: HttpClient) { }

  getPSP() {
    this.http.get("assets/Phosphorylation_site_dataset.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            if (!this.pspMap[row[0]]) {
              this.pspMap[row[0]] = []
            }
            const ps = reg.exec(row[1])
            if (ps) {
              this.pspMap[row[0]].push({res: parseInt(ps[2]), aa: ps[1], window: row[2]})
            }
          }
        }
      }
    })
  }
}

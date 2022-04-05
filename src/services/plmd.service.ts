import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PlmdService {
  plmdMap: any = {}
  acetylPLMDMap: any = {}
  methylPLMDMap: any = {}
  constructor(private http: HttpClient) { }

  getPLMD() {
    this.http.get("assets/Ubiquitination_PLMD.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            if (!this.plmdMap[row[1]]) {
              this.plmdMap[row[1]] = []
            }
            this.plmdMap[row[1]].push({res: parseInt(row[2])-1, aa: "", window: ""})
          }
        }
      }
    })
    this.http.get("assets/Methylation_PLMD.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            if (!this.methylPLMDMap[row[1]]) {
              this.methylPLMDMap[row[1]] = []
            }
            this.methylPLMDMap[row[1]].push({res: parseInt(row[2])-1, aa: "", window: ""})
          }
        }
      }
    })
    this.http.get("assets/Acetylation_PLMD.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            if (!this.acetylPLMDMap[row[1]]) {
              this.acetylPLMDMap[row[1]] = []
            }
            this.acetylPLMDMap[row[1]].push({res: parseInt(row[2])-1, aa: "", window: ""})
          }
        }
      }
    })
  }
}

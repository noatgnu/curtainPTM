import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {UniprotService} from "./uniprot.service";

@Injectable({
  providedIn: 'root'
})
export class CarbonyldbService {
  carbonylMap: any = {}
  constructor(private http: HttpClient, private uniprot: UniprotService) { }

  getCarbonylDB() {
    this.http.get("assets/databases/carbonyldb.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[0])
            if (matches) {
              if (!this.carbonylMap[matches[1]]) {
                this.carbonylMap[matches[1]] = {}
              }
              if (!this.carbonylMap[matches[1]][row[0]]) {
                this.carbonylMap[matches[1]][row[0]] = []
              }
              this.carbonylMap[matches[1]][row[0]].push({position: parseInt(row[1])-1, residue: row[2], window: ""})
            }
          }
        }
      }
    })
  }
}

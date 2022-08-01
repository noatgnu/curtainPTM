import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {UniprotService} from "./uniprot.service";

@Injectable({
  providedIn: 'root'
})
export class PlmdService {
  plmdMap: any = {}
  acetylPLMDMap: any = {}
  methylPLMDMap: any = {}
  constructor(private http: HttpClient, private uniprot: UniprotService) { }

  getPLMD() {
    this.http.get("assets/databases/Ubiquitination_PLMD.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[1])
            if (matches) {
              if (!this.plmdMap[matches[1]]) {
                this.plmdMap[matches[1]] = {}
              }
              if (!this.plmdMap[matches[1]][row[1]]) {
                this.plmdMap[matches[1]][row[1]] = []
              }
              this.plmdMap[matches[1]][row[1]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
    this.http.get("assets/databases/Methylation_PLMD.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[1])
            if (matches) {
              if (!this.methylPLMDMap[matches[1]]) {
                this.methylPLMDMap[matches[1]] = {}
              }
              if (!this.methylPLMDMap[matches[1]][row[1]]) {
                this.methylPLMDMap[matches[1]][row[1]] = []
              }
              this.methylPLMDMap[matches[1]][row[1]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
    this.http.get("assets/databases/Acetylation_PLMD.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[1])
            if (matches) {
              if (!this.acetylPLMDMap[matches[1]]) {
                this.acetylPLMDMap[matches[1]] = {}
              }
              if (!this.acetylPLMDMap[matches[1]][row[1]]) {
                this.acetylPLMDMap[matches[1]][row[1]] = []
              }
              this.acetylPLMDMap[matches[1]][row[1]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
  }
}

import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";

@Injectable({
  providedIn: 'root'
})
export class PspService {
  pspData: IDataFrame = new DataFrame()
  pspMap: any = {}
  ubiPSPMap: any = {}
  acetylPSPMap: any = {}
  substrateKinaseMap: any = {}
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
              this.pspMap[row[0]].push({res: parseInt(ps[2])-1, aa: ps[1], window: row[2]})
            }
          }
        }
      }
    })
    this.http.get("assets/Ubiquitination_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            if (!this.ubiPSPMap[row[0]]) {
              this.ubiPSPMap[row[0]] = []
            }
            const ps = reg.exec(row[1])
            if (ps) {
              this.ubiPSPMap[row[0]].push({res: parseInt(ps[2])-1, aa: ps[1], window: row[2]})
            }
          }
        }
      }
    })
    this.http.get("assets/Acetylation_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            if (!this.acetylPSPMap[row[0]]) {
              this.acetylPSPMap[row[0]] = []
            }
            const ps = reg.exec(row[1])
            if (ps) {
              this.acetylPSPMap[row[0]].push({res: parseInt(ps[2])-1, aa: ps[1], window: row[2]})
            }
          }
        }
      }
    })
    this.http.get("assets/Kinase_Substrate_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length > 6) {
            if (!this.substrateKinaseMap[row[6]]) {
              this.substrateKinaseMap[row[6]] = {}
            }
            const ps = reg.exec(row[9])
            if (ps) {
              const site = parseInt(ps[2])
              if (!this.substrateKinaseMap[row[6]][site]) {
                this.substrateKinaseMap[row[6]][site] = []
              }
              this.substrateKinaseMap[row[6]][site].push({kinase: row[1], acc: row[2]})
            }
          }
        }
      }
      console.log(this.substrateKinaseMap)
    })
  }

}

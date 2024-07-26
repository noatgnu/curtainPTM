import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {DataFrame, fromCSV, IDataFrame} from "data-forge";
import {UniprotService} from "./uniprot.service";

@Injectable({
  providedIn: 'root'
})
export class PspService {
  pspData: IDataFrame = new DataFrame()
  pspMap: any = {}
  ubiPSPMap: any = {}
  acetylPSPMap: any = {}
  substrateKinaseMap: any = {}
  methylationPSPMap: any = {}
  sumoylationPSPMap: any = {}



  constructor(private http: HttpClient, private uniprot: UniprotService) {

  }

  getPSP() {
    this.http.get("assets/databases/Phosphorylation_site_dataset.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[0])
            if (matches) {
              if (!this.pspMap[matches[1]]) {
                this.pspMap[matches[1]] = {}
              }
              if (!this.pspMap[matches[1]][row[0]]) {
                this.pspMap[matches[1]][row[0]] = []
              }
              const ps = reg.exec(row[1])
              if (ps) {
                this.pspMap[matches[1]][row[0]].push({position: parseInt(ps[2])-1, residue: ps[1], window: row[2]})
              }
              this.pspMap[matches[1]][row[0]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
    this.http.get("assets/databases/Ubiquitination_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[0])
            if (matches) {
              if (!this.ubiPSPMap[matches[1]]) {
                this.ubiPSPMap[matches[1]] = {}
              }
              if (!this.ubiPSPMap[matches[1]][row[0]]) {
                this.ubiPSPMap[matches[1]][row[0]] = []
              }
              const ps = reg.exec(row[1])
              if (ps) {
                this.ubiPSPMap[matches[1]][row[0]].push({position: parseInt(ps[2])-1, residue: ps[1], window: row[2]})
              }
              this.ubiPSPMap[matches[1]][row[0]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
    this.http.get("assets/databases/Acetylation_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[0])
            if (matches) {
              if (!this.acetylPSPMap[matches[1]]) {
                this.acetylPSPMap[matches[1]] = {}
              }
              if (!this.acetylPSPMap[matches[1]][row[0]]) {
                this.acetylPSPMap[matches[1]][row[0]] = []
              }
              const ps = reg.exec(row[1])
              if (ps) {
                this.acetylPSPMap[matches[1]][row[0]].push({position: parseInt(ps[2])-1, residue: ps[1], window: row[2]})
              }
              this.acetylPSPMap[matches[1]][row[0]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
    this.http.get("assets/databases/Methylation_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[0])
            if (matches) {
              if (!this.methylationPSPMap[matches[1]]) {
                this.methylationPSPMap[matches[1]] = {}
              }
              if (!this.methylationPSPMap[matches[1]][row[0]]) {
                this.methylationPSPMap[matches[1]][row[0]] = []
              }
              const ps = reg.exec(row[1])
              if (ps) {
                this.methylationPSPMap[matches[1]][row[0]].push({position: parseInt(ps[2])-1, residue: ps[1], window: row[2]})
              }
              this.methylationPSPMap[matches[1]][row[0]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
    this.http.get("assets/databases/Sumoylation_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length === 3) {
            const matches = this.uniprot.Re.exec(row[0])
            if (matches) {
              if (!this.sumoylationPSPMap[matches[1]]) {
                this.sumoylationPSPMap[matches[1]] = {}
              }
              if (!this.sumoylationPSPMap[matches[1]][row[0]]) {
                this.sumoylationPSPMap[matches[1]][row[0]] = []
              }
              const ps = reg.exec(row[1])
              if (ps) {
                this.sumoylationPSPMap[matches[1]][row[0]].push({position: parseInt(ps[2])-1, residue: ps[1], window: row[2]})
              }
              this.sumoylationPSPMap[matches[1]][row[0]].push({position: parseInt(row[2])-1, residue: "", window: ""})
            }
          }
        }
      }
    })
    this.http.get("assets/databases/Kinase_Substrate_PSP.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          const reg = /(\w)(\d+)/g
          if (row.length > 6) {
            const matches = this.uniprot.Re.exec(row[6])
            if (matches) {
              if (!this.substrateKinaseMap[matches[1]]) {
                this.substrateKinaseMap[matches[1]] = {}
              }
              if (!this.substrateKinaseMap[matches[1]][row[6]]) {
                this.substrateKinaseMap[matches[1]][row[6]] = {}
              }
              const ps = reg.exec(row[9])
              if (ps) {
                const site = parseInt(ps[2]) -1
                if (!this.substrateKinaseMap[matches[1]][row[6]][site]) {
                  this.substrateKinaseMap[matches[1]][row[6]][site] = []
                }
                this.substrateKinaseMap[matches[1]][row[6]][site].push({kinase: row[1], acc: row[2], substrate: row[6]})
              }
            }
          }
        }
      }
    })
  }

}

import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PlmdService {
  plmdMap: any = {}
  constructor(private http: HttpClient) { }

  getPLMD() {
    this.http.get("assets/Ubiquitination_PLMD.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 7) {
            if (!this.plmdMap[row[0]]) {
              this.plmdMap[row[1]] = []
            }
            this.plmdMap[row[1]].push({res: parseInt(row[2])-1, aa: row[4][parseInt(row[2])-1], window: ""})
          }
        }
      }
    })
  }
}

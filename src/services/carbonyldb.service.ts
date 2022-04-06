import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class CarbonyldbService {
  carbonylMap: any = {}
  constructor(private http: HttpClient) { }

  getCarbonylDB() {
    this.http.get("assets/carbonyldb.tsv", {responseType: "text", observe: "body"}).subscribe(data => {
      if (data) {
        const lines = data.split("\n")
        for (const line of lines) {
          const row = line.split("\t")
          if (row.length === 3) {
            if (!this.carbonylMap[row[0]]) {
              this.carbonylMap[row[0]] = []
            }
            this.carbonylMap[row[0]].push({res: parseInt(row[1])-1, aa: row[2], window: ""})
          }
        }
      }
    })
  }
}

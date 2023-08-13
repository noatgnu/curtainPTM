import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class PtmDiseasesService {
  ptmDiseasesMap: any = {}
  constructor(private http: HttpClient) { }

  parsePTMDiseases() {
    this.http.get("assets/databases/ptm_disease.txt", {responseType: 'text'}).subscribe(data => {
      let lines = data.split(/\r?\n/g)
      for (const l of lines) {
        const r = l.split("\t")
        if (!this.ptmDiseasesMap[r[0]]) {
          this.ptmDiseasesMap[r[0]] = []
        }
        this.ptmDiseasesMap[r[0]].push({
          acc: r[0],
          gene: r[1],
          disease: r[2],
          mod: r[3],
          state: r[4],
          residue: r[5],
          position: r[6],
        })
      }
    })
  }

  getPTMDiseases(acc: string) {
    return this.ptmDiseasesMap[acc]
  }
}

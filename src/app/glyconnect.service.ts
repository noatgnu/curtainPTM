import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class GlyconnectService {
  glyconnectNMap: any = {}
  glyconnectOMap: any = {}
  constructor(private http: HttpClient) { }

  getGlyconnect(acc: string) {
    return this.http.get("https://glyconnect.expasy.org/api/glycosylations?uniprot=" + acc, {responseType: "json"})
  }
}

import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {WebService} from "./web.service";

@Injectable({
  providedIn: 'root'
})
export class InteractomeAtlasService {

  constructor(private http: HttpClient, private web: WebService) { }

  async getInteractome(genes: string[], filter_parameter: string = "None") {
    const options: Map<string, string> = new Map<string, string>([
        ["query_interactor", "query"],
        ["query_id_array", genes.join("%2C")],
        ["search_term_parameter", genes.join("%2C")],
        ["filter_parameter", filter_parameter],
      ]
    )
    let search_term_array: string[] = []
    for (const g of genes) {
      search_term_array.push("search_term_array%5B%5D="+g)
    }

    const res = await this.http.get("https://www.interactome-atlas.org/search_results_interactions?"+ this.web.toParamString(options) + "&" + search_term_array.join("&"), {responseType:"json", observe: "body"}).toPromise()
    return JSON.parse(<string>res)
  }
}

import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {CurtainLink} from "../app/classes/curtain-link";

@Injectable({
  providedIn: 'root'
})
export class WebService {
  links: CurtainLink = new CurtainLink()
  replacer(key: any, value: any) {
    if(value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
      };
    } else {
      return value;
    }
  }

  reviver(key: any, value: any) {
    if(typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }

  constructor(private http: HttpClient) { }

  putSettings(settings: any) {
    return this.http.put(this.links.proxyURL + "file_data", JSON.stringify(settings, this.replacer), {responseType: "text", observe: "response"})
  }

  postSettings(id: string, password: string) {
    return this.http.post(this.links.proxyURL +"file_data", JSON.stringify({id: id, password: password}), {responseType: "text", observe: "response"})
  }
}

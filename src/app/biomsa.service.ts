import { Injectable } from '@angular/core';

import * as biomsa from "biomsa"

@Injectable({
  providedIn: 'root'
})
export class BiomsaService {

  constructor() { }

  alignSequences(sequences: any) {
    return biomsa.default.align(Object.values(sequences))
  }
}

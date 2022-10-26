import { Injectable } from '@angular/core';

// @ts-ignore
import * as jstat from 'jstat';

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor() { }

  calculateAnova(conditionA: any[], conditionB: any[]) {
    return {f: jstat.anovaftest(conditionA, conditionB)}
  }

  calculateAnova2(conditions: any[]) {
    return {f: jstat.anovaftest(...conditions)}
  }

  calculateTTest(conditionA: any[], conditionB: any[]) {
    return {f: jstat.ttest([conditionA, conditionB])}
  }
}

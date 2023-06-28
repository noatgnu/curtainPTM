import { Injectable } from '@angular/core';

// @ts-ignore
import * as jstat from 'jstat';
import {AccountsService} from "./accounts/accounts.service";

@Injectable({
  providedIn: 'root'
})
export class StatsService {

  constructor(private accounts: AccountsService) { }

  calculateAnova(conditionA: any[], conditionB: any[]) {
    return {f: jstat.anovaftest(conditionA, conditionB)}
  }

  calculateAnova2(conditions: any[]) {
    return {f: jstat.anovaftest(...conditions)}
  }

  calculateTTest(conditionA: any[], conditionB: any[]) {
    return this.accounts.curtainAPI.postPrimitiveStatsTest([conditionA.filter((a: number) => {
      return !isNaN(a)
    }), conditionB.filter((a: number) => {
      return !isNaN(a)
    })], "t-test")

  }
}

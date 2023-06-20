import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {DataService} from "../../data.service";
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction} from "rxjs";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {BatchSearchComponent} from "../batch-search/batch-search.component";
import {UniprotService} from "../../uniprot.service";
import {DataFrame, IDataFrame} from "data-forge";

export interface selectionData {
  data: string[];
  title: string;
}

@Component({
  selector: 'app-protein-selections',
  templateUrl: './protein-selections.component.html',
  styleUrls: ['./protein-selections.component.scss']
})
export class ProteinSelectionsComponent implements OnInit {

  tableFilterModel: string = ""
  @Output() searchResult: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  progressBar: any = {text: "", value: 0}


  openBatchSearch() {
    const ref = this.modal.open(BatchSearchComponent, {size: "lg"})
    ref.closed.subscribe(data => {
      console.log(data)
      let result: string[] = []

      for (const d in data.data) {
        if (data.searchType === "Primary IDs") {
          for (const m of data.data[d]) {
            result.push(m)
          }
        } else {
          let res = this.parseData(data, d, true);
          if (res.length === 0) {
            for (const dd of data.data[d]) {
              res = this.parseData(data, dd, false)
              if (res.length > 0) {
                for (const a of res) {
                  if (!result.includes(a)) {
                    result.push(a)
                  }
                }
              }
            }
          }
          if (res.length > 0) {
            for (const a of res) {
              if (!result.includes(a)) {
                result.push(a)
              }
            }
          }
        }
      }
      if (data["params"]) {
        if (data.params.enableAdvanced) {
          let res: string[] = []
          let df = this.data.currentDF.where(
            r =>
              r[this.data.differentialForm.significant] >= data.params.minP &&
                r[this.data.differentialForm.significant] <= data.params.maxP
          ).bake()
          if (data.params.searchLeft || data.params.searchRight) {
            if (data.params.searchRight) {
              const temp = df.where(
                r =>
                  (r[this.data.differentialForm.foldChange] >= data.params.minFCRight) &&
                  (r[this.data.differentialForm.foldChange] <= data.params.maxFCRight)
              ).bake()
              res = temp.getSeries(this.data.differentialForm.primaryIDs).bake().toArray()
            }
            if (data.params.searchLeft) {

              console.log(data)
              const left = df.where(
                r =>
                  (r[this.data.differentialForm.foldChange] >= -data.params.maxFCLeft) &&
                  (r[this.data.differentialForm.foldChange] <= -data.params.minFCLeft)
              ).bake()
              console.log(left)
              res = res.concat(left.getSeries(this.data.differentialForm.primaryIDs).bake().toArray())
            }
            result = res
          } else {
            result = df.getSeries(this.data.differentialForm.primaryIDs).bake().toArray()
          }

        }
      }
      this.searchResult.emit({data: result, title: data.title})
    })

  }

  private parseData(data: any, d: string, exact: boolean) {
    switch (data.searchType) {
      case "Gene Names":
        if (exact) {
          return this.data.getPrimaryFromGeneNames(d)
        } else {
          if (this.data.genesMap[d]) {
            for (const m in this.data.genesMap[d]) {
              const res = this.data.getPrimaryFromGeneNames(m)
              if (res.length > 0) {
                return res
              }
            }
          }
        }
        break
      case "Accession IDs":
        if (exact) {
          return this.data.getPrimaryFromAcc(d)
        } else {
          if (this.data.accessionMap[d]) {
            for (const m in this.data.accessionMap[d]) {
              const res = this.data.getPrimaryFromAcc(m)
              if (res.length > 0) {
                return res
              }
            }
          }
        }
        break
    }
    return []
  }



  constructor(public data: DataService, private modal: NgbModal, private uniprot: UniprotService) { }

  ngOnInit(): void {
  }

  singleSearchHandle() {
    const data: any = {}
    data[this.tableFilterModel] = {}
    data[this.tableFilterModel][this.tableFilterModel] = true
    let res: string[] = []
    if (this.data.searchType === "Primary IDs") {
      res = [this.tableFilterModel]
    } else {
      res = this.parseData({data: data, searchType: this.data.searchType, title: "Single Selection"}, this.tableFilterModel, true)
    }

    this.searchResult.emit({data: res, title: this.tableFilterModel})
  }
}

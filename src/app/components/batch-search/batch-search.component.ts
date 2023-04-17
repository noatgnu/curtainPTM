import { Component, OnInit } from '@angular/core';
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {DataService} from "../../data.service";
import {AccountsService} from "../../accounts/accounts.service";

@Component({
  selector: 'app-batch-search',
  templateUrl: './batch-search.component.html',
  styleUrls: ['./batch-search.component.scss']
})
export class BatchSearchComponent implements OnInit {
  data: string = ""
  searchType: "Gene Names"| "Primary IDs" = "Gene Names"
  title: string = ""
  builtInList: string[] = []
  currentID: number = -1
  params = {
    enableAdvanced: false,
    searchLeft: false,
    searchRight: false,
    maxFCRight: 0,
    maxFCLeft: 0,
    minFCRight: 0,
    minFCLeft: 0,
    maxP: 0,
    minP: 0
  }
  canDelete: boolean = false
  filterList: any[] = []
  constructor(private modal: NgbActiveModal, public web: WebService, private dataService: DataService, private accounts: AccountsService) {
    this.builtInList = Object.keys(this.web.filters)
    this.params.maxFCRight = Math.abs(this.dataService.minMax.fcMax)
    this.params.maxFCLeft = Math.abs(this.dataService.minMax.fcMin)
    this.params.maxP = this.dataService.minMax.pMax
    this.params.minP = this.dataService.minMax.pMin
    this.getAllList();
  }
  private getAllList() {
    this.accounts.curtainAPI.getDataFilterList().then((data: any) => {
      this.filterList = data.data.results.map((a: any) => {
        return {name: a.name, id: a.id}
      })
    })
  }
  ngOnInit(): void {
  }

  updateTextArea(categoryID: number) {
/*    this.web.getFilter(categoryName).then(r => {
      this.data = r
      this.title = this.web.filters[categoryName].name
    })*/
    this.accounts.curtainAPI.getDataFilterListByID(categoryID).then((data: any) => {
      this.data = data.data.data
      this.title = data.data.name
      this.canDelete = !data.data.default
      this.currentID = data.data.id
    })
  }

  handleSubmit() {
    const result: any = {}
    for (const r of this.data.split("\n")) {
      const a = r.trim()
      if (a !== "") {
        const e = a.split(";")
        if (!result[a]) {
          result[a] = []
        }
        for (let f of e) {
          f = f.trim()
          result[a].push(f)
        }
      }
    }
    this.modal.close({searchType: this.searchType, data: result, title: this.title, params: this.params})
  }

  close() {
    this.modal.dismiss()
  }

  saveDataFilterList() {
    this.accounts.curtainAPI.saveDataFilterList(this.title, this.data).then((data:any) => {
      this.getAllList()
      this.data = data.data.data
      this.title = data.data.name
      this.canDelete = !data.data.default
      this.currentID = data.data.id
    })
  }

  deleteDataFilterList() {
    this.accounts.curtainAPI.deleteDataFilterList(this.currentID).then(data => {
      this.title = ""
      this.data = ""
      this.currentID = -1
      this.getAllList()
    })
  }
}

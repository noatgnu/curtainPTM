import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {DataService} from "../../../services/data.service";
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction} from "rxjs";
import {UniprotService} from "../../../services/uniprot.service";

@Component({
  selector: 'app-quick-search',
  templateUrl: './quick-search.component.html',
  styleUrls: ['./quick-search.component.css']
})
export class QuickSearchComponent implements OnInit {
  @Output() selected: EventEmitter<any[]> = new EventEmitter<any[]>()
  searchType = "Gene names"
  selectedProteinModel: string = ""
  selectedProtein: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilter(term))
    )
  searchFilter(term: string) {
    console.log(term)
    switch (this.searchType) {
      case "Primary IDs":
        return this.dataService.primaryIDsList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Accession IDs":
        return this.dataService.accList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      case "Gene names":
        return this.dataService.geneList.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
      default:
        return [""]
    }
  }

  constructor(private dataService: DataService, private uniprot: UniprotService) {
    this.dataService.selectionService.subscribe(data => {
      if (data) {
        console.log(data)
        this.searchType = data.type
        this.selectedProteinModel = data.data
        this.selectData()
      }
    })
  }

  ngOnInit(): void {
  }

  selectData() {

    switch (this.searchType) {
      case "Primary IDs":
        const res = this.dataService.dataFile.data.where(row => row[this.dataService.cols.primaryIDComparisonCol] === this.selectedProteinModel).bake().toArray()
        this.selected.emit(res)
        break
      case "Accession IDs":
        if (this.dataService.dataMap.has(this.selectedProteinModel)) {
          const res = this.dataService.dataFile.data.where(row => row[this.dataService.cols.accessionCol] === this.selectedProteinModel).bake().toArray()
          this.selected.emit(res)
        }
        break
      case "Gene names":
        if (this.uniprot.geneNamesMap.has(this.selectedProteinModel)) {
          const ids: any[] = []
          // @ts-ignore
          for (const g of this.uniprot.geneNamesMap.get(this.selectedProteinModel)) {
            ids.push(g.primaryIDs)
          }
          const res = this.dataService.dataFile.data.where(row =>  ids.includes(row[this.dataService.cols.primaryIDComparisonCol]) ).bake().toArray()
          this.selected.emit(res)
        }
        break
      default:
        break
    }
  }
}

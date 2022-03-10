import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {debounceTime, distinctUntilChanged, map, Observable, OperatorFunction} from "rxjs";
import {DataService} from "../../../services/data.service";
import {UniprotService} from "../../../services/uniprot.service";

@Component({
  selector: 'app-quick-search-selected',
  templateUrl: './quick-search-selected.component.html',
  styleUrls: ['./quick-search-selected.component.css']
})
export class QuickSearchSelectedComponent implements OnInit {
  @Output() selected: EventEmitter<string> = new EventEmitter<string>()
  selectedProteinModel: string = ""
  selectedProtein: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.searchFilter(term))
    )

  searchFilter(term: string) {
    return this.dataService.queryGeneNames.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0,10)
  }

  constructor(private dataService: DataService, private uniprot: UniprotService) { }

  ngOnInit(): void {
    if (this.dataService.queryGeneNames.length === 0 && this.dataService.queryProtein.length > 0) {
      for (const p of this.dataService.queryProtein) {
        const a = this.uniprot.getUniprotFromPrimary(p)["Gene names"]
        if (a) {
          this.dataService.queryGeneNames.push(a)
        }
      }
    }
  }
  selectData(){
    const ind = this.dataService.queryGeneNames.indexOf(this.selectedProteinModel)
    if (ind !== -1) {
      this.selected.emit(this.dataService.queryProtein[ind])
    }

  }
}

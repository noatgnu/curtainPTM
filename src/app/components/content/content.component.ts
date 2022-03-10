import { Component, OnInit } from '@angular/core';
import {DataService} from "../../../services/data.service";

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.css']
})
export class ContentComponent implements OnInit {
  displayArray: any[] = []
  perPage: number = 5
  currentPage: number = 1
  constructor(public dataService: DataService) {
    this.dataService.finishedSelection.subscribe(data => {
      if (data) {
        this.createPages()
      }
    })
  }

  ngOnInit(): void {
    this.createPages();
    console.log(this.displayArray.length)
  }

  private createPages() {
    this.displayArray = []
    let n = 0
    let tempArray: any[] = []
    for (let i = 0; i < this.dataService.queryProtein.length; i++) {
      if (n === this.perPage) {
        n = 0
        this.displayArray.push(tempArray.slice())
        tempArray = []
      }
      tempArray.push({pos: i, data: this.dataService.queryProtein[i]})
      n++
    }
    if (n !== this.perPage && n !== 0) {
      this.displayArray.push(tempArray.slice())
    }
  }

  scrollToTop() {
    this.dataService.scrollToID("top-page")
  }

  selectAndScroll(e: string) {
    let breaking = false
    for (let i = 0; i < this.displayArray.length; i++) {
      for (const c of this.displayArray[i]) {
        if (c.data === e) {
          this.currentPage = i+1
          this.dataService.scrollToID(c.data+"id")
          breaking = true
          break
        }
      }
      if (breaking) {
        break
      }
    }
  }
}

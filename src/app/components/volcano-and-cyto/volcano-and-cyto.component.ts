import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {DataService} from "../../data.service";
import {selectionData} from "../protein-selections/protein-selections.component";
import {ScrollService} from "../../scroll.service";
import {ThemeService} from "../../theme.service";
import {Subscription} from "rxjs";

@Component({
    selector: 'app-volcano-and-cyto',
    templateUrl: './volcano-and-cyto.component.html',
    styleUrls: ['./volcano-and-cyto.component.scss'],
    standalone: false
})
export class VolcanoAndCytoComponent implements OnInit, OnDestroy {
  private themeSubscription?: Subscription;
  @Output() selected: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  isVolcanoCollapse: boolean = false
  isNetworkCollapse: boolean = true
  constructor(public data: DataService, private scroll: ScrollService, private themeService: ThemeService) { }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.beforeThemeChange$.subscribe(() => {
      if (!this.isNetworkCollapse) {
        this.isNetworkCollapse = true;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  handleVolcanoSelection(e: selectionData){
    this.selected.emit(e)
  }
}

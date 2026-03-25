import {Component, effect, EventEmitter, OnInit, Output} from '@angular/core';
import {DataService} from "../../data.service";
import {selectionData} from "../protein-selections/protein-selections.component";
import {ScrollService} from "../../scroll.service";
import {ThemeService} from "../../theme.service";

@Component({
    selector: 'app-volcano-and-cyto',
    templateUrl: './volcano-and-cyto.component.html',
    styleUrls: ['./volcano-and-cyto.component.scss'],
    standalone: false
})
export class VolcanoAndCytoComponent implements OnInit {
  @Output() selected: EventEmitter<selectionData> = new EventEmitter<selectionData>()
  isVolcanoCollapse: boolean = false
  isNetworkCollapse: boolean = true
  constructor(public data: DataService, private scroll: ScrollService, private themeService: ThemeService) {
    effect(() => {
      const counter = this.themeService.beforeThemeChange();
      if (counter > 0 && !this.isNetworkCollapse) {
        this.isNetworkCollapse = true;
      }
    });
  }

  ngOnInit(): void {
  }

  handleVolcanoSelection(e: selectionData){
    this.selected.emit(e)
  }
}

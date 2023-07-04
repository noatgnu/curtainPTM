import {AfterContentInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {DataService} from "../../data.service";

@Component({
  selector: 'app-draggable-element',
  templateUrl: './draggable-element.component.html',
  styleUrls: ['./draggable-element.component.scss']
})
export class DraggableElementComponent implements OnInit, AfterContentInit {
  @Input() label = ""
  constructor(private data: DataService) { }

  ngOnInit(): void {
  }

  ngAfterContentInit() {
    /*    this.draggableBadge?.nativeElement.addEventListener("dragstart", (e:any) => {
          e.dataTransfer?.setData("text/plain", this.label)
        })*/
  }

  handleDragStart(e: any) {
    e.dataTransfer?.setData("text/plain", JSON.stringify({type: "selection-group", title: this.label}))
  }

}

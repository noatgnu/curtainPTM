import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {fromCSV, IDataFrame} from 'data-forge';
import {InputFile} from "../../classes/input-file";

@Component({
  selector: 'app-file-input-widget',
  templateUrl: './file-input-widget.component.html',
  styleUrls: ['./file-input-widget.component.scss']
})
export class FileInputWidgetComponent implements OnInit {
  @Output() readData: EventEmitter<InputFile> =  new EventEmitter<InputFile>()
  @Input() fileType: string = ""
  filename: string = ""
  constructor() { }

  ngOnInit(): void {
  }

  handleFile(e: Event) {
    if (e.target) {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.filename = target.files[0].name
        const reader = new FileReader();
        reader.onload = (event) => {
          const loadedFile = reader.result;
          this.readData.emit(new InputFile(fromCSV(<string>loadedFile), this.filename, <string>loadedFile))
        }
        reader.readAsText(target.files[0]);
      }
    }
  }

}

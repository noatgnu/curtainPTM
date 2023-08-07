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
  @Output() eventProgress: EventEmitter<number> = new EventEmitter<number>()
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
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            this.eventProgress.emit(progress)
          }
        }
        reader.onload = (event) => {
          // update progress
          this.eventProgress.emit(100)
          const loadedFile = reader.result;
          this.readData.emit(new InputFile(fromCSV(<string>loadedFile), this.filename, <string>loadedFile))
        }
        reader.readAsText(target.files[0]);
      }
    }
  }

}

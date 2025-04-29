import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {SettingsService} from "../../settings.service";
import {WebService} from "../../web.service";
import {DataService} from "../../data.service";


@Component({
    selector: 'app-pride',
    templateUrl: './pride.component.html',
    styleUrls: ['./pride.component.scss'],
    standalone: false
})
export class PrideComponent implements OnInit {
  @ViewChild("projectDescription") projectDescription: ElementRef | undefined
  isCollapse: boolean = true
  constructor(public settings: SettingsService, private web: WebService, public data: DataService) {

  }

  ngOnInit(): void {
  }

  getPDF() {
    /*if (this.projectDescription !== undefined) {
      html2canvas(this.projectDescription.nativeElement).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF('p', 'mm', 'a4');
        const width = doc.internal.pageSize.getWidth()
        const height = doc.internal.pageSize.getHeight()

        doc.addImage(imgData, 0, 0, canvas.width, canvas.height)

        const nameDocument: string = 'project';

        doc.save(nameDocument + '.pdf');
      })
    }*/
    if (this.projectDescription !== undefined) {
      const printWindow = window.open('', 'PRINT', "height=1280,width=720")
      if (printWindow) {

      }
    }

  }
}

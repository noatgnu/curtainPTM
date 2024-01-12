import { Component } from '@angular/core';
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {WebService} from "../../web.service";
import {UniprotService} from "../../uniprot.service";

@Component({
  selector: 'app-primary-id-export-modal',
  standalone: true,
  imports: [],
  templateUrl: './primary-id-export-modal.component.html',
  styleUrl: './primary-id-export-modal.component.scss'
})
export class PrimaryIdExportModalComponent {

  selections: string[] = []

  constructor(private dataService: DataService, public modal: NgbActiveModal, private web: WebService, private uniprot: UniprotService) {
    this.selections = this.dataService.selectOperationNames.slice()
  }

  export(selection: string = "", format: "primaryID"|"geneNames" = "primaryID") {
    const data: string[] = []
    if (selection === "") {
      for (const s in this.dataService.selectedMap) {
        for (const i of this.dataService.selectedMap[s]) {
          if (this.dataService.selectedMap[s][i]) {
            if (format === "primaryID") {
              data.push(i)
            } else {
              const uni = this.uniprot.getUniprotFromAcc(i)
              if (uni && !data.includes(uni["Gene Names"])) {
                data.push(uni["Gene Names"])
              }
            }
          }
        }
      }
    } else {

      for (const i in this.dataService.selectedMap) {
        if (this.dataService.selectedMap[i]) {
          if (this.dataService.selectedMap[i][selection]) {
            if (format === "primaryID") {
              data.push(i)
            } else {
              const uni = this.uniprot.getUniprotFromAcc(i)
              if (uni && !data.includes(uni["Gene Names"])) {
                data.push(uni["Gene Names"])
              }
            }
          }

        }
      }
    }

    this.web.downloadFile(`${selection}.txt`, data.join("\n"))
  }

}

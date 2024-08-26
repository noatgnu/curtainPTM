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

  export(selection: string = "", format: "primaryID"|"geneNames"|"dataSearched"|"dataDF" = "primaryID") {
    const data: string[] = []
    if (selection === "") {
      if (format === "primaryID" || format === "geneNames") {
        for (const s in this.dataService.selectedMap) {
          for (const i in this.dataService.selectedMap[s]) {
            if (this.dataService.selectedMap[s][i]) {
              if (format === "primaryID") {
                data.push(s)
              } else {
                const uni = this.uniprot.getUniprotFromAcc(i)
                if (uni && !data.includes(uni["Gene Names"])) {
                  data.push(uni["Gene Names"])
                }
              }
            }
          }
        }
      } else if (format === "dataSearched") {
        const selectedIDs: string[] = []
        for (const s in this.dataService.selectedMap) {
          for (const i in this.dataService.selectedMap[s]) {
            if (this.dataService.selectedMap[s][i]) {
              if (!selectedIDs.includes(s)) {
                selectedIDs.push(s)
              }
            }
          }
        }
        // @ts-ignore
        const searched = this.dataService.raw.df.where(row => selectedIDs.includes(row[this.dataService.rawForm.primaryIDs])).bake().toCSV({delimiter: "\t"})
        data.push(searched)
      } else if (format === "dataDF") {
        const selectedIDs: string[] = []
        for (const s in this.dataService.selectedMap) {
          for (const i in this.dataService.selectedMap[s]) {
            if (this.dataService.selectedMap[s][i]) {
              if (!selectedIDs.includes(s)) {
                selectedIDs.push(s)
              }
            }
          }
        }
        // @ts-ignore
        const searched = this.dataService.currentDF.where(row => selectedIDs.includes(row[this.dataService.differentialForm.primaryIDs])).bake().toCSV({delimiter: "\t"})
        data.push(searched)
      }

    } else {
      if (format === "primaryID" || format === "geneNames") {
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
      } else if (format === "dataSearched") {
        const selectedIDs: string[] = []
        for (const s in this.dataService.selectedMap) {
          if (this.dataService.selectedMap[s]) {
            if (this.dataService.selectedMap[s][selection]) {
              if (!selectedIDs.includes(s)) {
                selectedIDs.push(s)
              }
            }
          }
        }
        // @ts-ignore
        const searched = this.dataService.raw.df.where(row => selectedIDs.includes(row[this.dataService.rawForm.primaryIDs])).bake().toCSV({delimiter: "\t"})
        data.push(searched)
      } else if (format === "dataDF") {
        const selectedIDs: string[] = []
        for (const s in this.dataService.selectedMap) {
          if (this.dataService.selectedMap[s]) {
            if (this.dataService.selectedMap[s][selection]) {
              if (!selectedIDs.includes(s)) {
                selectedIDs.push(s)
              }
            }
          }
        }
        // @ts-ignore
        const df = this.dataService.currentDF.where(row => selectedIDs.includes(row[this.dataService.differentialForm.primaryIDs])).bake().toCSV({delimiter: "\t"})
        data.push(df)
      }
    }
    if (selection === "") {
      this.web.downloadFile(`selected.txt`, data.join("\n"))
    } else {
      this.web.downloadFile(`${selection}.txt`, data.join("\n"))
    }
  }

}

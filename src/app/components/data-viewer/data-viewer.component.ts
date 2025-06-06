import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame, ISeries, Series} from "data-forge";
import {FormBuilder} from "@angular/forms";
import {DataService} from "../../data.service";
import {debounceTime, distinctUntilChanged} from "rxjs";
import {UniprotService} from "../../uniprot.service";
import {ToastService} from "../../toast.service";

@Component({
    selector: 'app-data-viewer',
    templateUrl: './data-viewer.component.html',
    styleUrls: ['./data-viewer.component.scss'],
    standalone: false
})
export class DataViewerComponent implements OnInit {
  _data: ISeries<number, IDataFrame<number, any>> = new Series()
  baseData: ISeries<number, IDataFrame<number, any>> = new Series()
  form = this.fb.group({
    filterTerm: [""],
    filterType: ["Gene Names"],
    filterSearchOperation: ["All selected"],
  })
  ready = false

  @Input() set data(value: ISeries<number, IDataFrame<number, any>>) {
    this._data = value
    this.baseData = value
    this.displaySeries = value
    this.ready = true
  }

  get data(): ISeries<number, IDataFrame<number, any>> {
    return this._data
  }

  displaySeries: ISeries<number, IDataFrame<number, any>> = new Series()
  constructor(private fb: FormBuilder, public dataService: DataService, private uniprot: UniprotService, private toast: ToastService) {
    this.form.controls["filterTerm"].valueChanges.pipe(debounceTime(200), distinctUntilChanged()).subscribe((value) => {
      let primaryIds: string[] = []
      if (value){
        if (value.length > 2) {
          switch (this.form.controls["filterType"].value) {
            case "Gene Names":
              const genes = this.dataService.selectedGenes.filter((gene: string) => gene.toLowerCase().includes(value.toLowerCase()))
              genes.forEach((gene: string) => {
                primaryIds.push(this.dataService.getPrimaryFromGeneNames(gene)[0])
              })
              break
            case "Primary IDs":
              primaryIds = this.dataService.selected.filter((primaryID: string) => primaryID.toLowerCase().includes(value.toLowerCase()))
              break
            case "Diseases":
              this.baseData.forEach((df: IDataFrame<number, any>) => {
                const acc = df.getSeries(this.dataService.differentialForm.accession).bake().toArray()[0]
                const uni = this.uniprot.getUniprotFromAcc(acc)
                if (uni["Involvement in disease"]) {
                  if (uni["Involvement in disease"].toLowerCase().includes(value.toLowerCase())) {
                    primaryIds.push(df.getSeries(this.dataService.differentialForm.primaryIDs).bake().toArray()[0])
                  }
                }
              })
              break
          }
          if (value === "") {
            this.displaySeries = this.baseData
          } else if (primaryIds.length > 0) {
            this.displaySeries = this.baseData.where((df: IDataFrame<number, any>) => {
              const s = df.getSeries(this.dataService.differentialForm.primaryIDs).bake()
              return s.bake().any((primaryID: string) => {
                return primaryIds.includes(primaryID)
              })
            }).bake()
          } else {
            this.displaySeries = new Series()
          }
        }
      } else {
        this.displaySeries = this.baseData
      }

    })

    this.form.controls.filterSearchOperation.valueChanges.subscribe((value) => {
      this.ready = false
      this.toast.show("Filtering", "Filtering data for " + value, 5000).then()
      console.log(this.displaySeries.count(), this.baseData.count(), this.data.count())
      if (value) {
        const result = []
        const toBeFiltered: string[] = []
        if (value === "All selected") {
          this.baseData = this._data
        } else if (this.dataService.selectOperationNames.includes(value)) {
          for (const i in this.dataService.selectedMap) {
            if (this.dataService.selectedMap[i][value]) {
              toBeFiltered.push(i)
            }
          }
          this.baseData = this._data.where((df: IDataFrame<number, any>) => {
            const s = df.getSeries(this.dataService.differentialForm.primaryIDs).bake()
            return s.any((primaryID: string) => {
              return toBeFiltered.includes(primaryID)
            })
          }).bake()
        }
      }
      this.toast.show("Filtering", "Completed filtering data for " + value, 5000).then()
      this.displaySeries = this.baseData
      console.log(this.displaySeries.count(), this.baseData.count(), this.data.count())
      this.ready = true
    })
  }

  ngOnInit(): void {
  }

}

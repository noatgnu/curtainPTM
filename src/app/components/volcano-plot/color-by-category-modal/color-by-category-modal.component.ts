import {Component, Input} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {ColorPickerModule} from "ngx-color-picker";

@Component({
    selector: 'app-color-by-category-modal',
    imports: [
        FormsModule,
        ColorPickerModule,
        ReactiveFormsModule
    ],
    templateUrl: './color-by-category-modal.component.html',
    styleUrl: './color-by-category-modal.component.scss'
})
export class ColorByCategoryModalComponent {
  @Input() data: IDataFrame = new DataFrame()
  @Input() primaryIDColumn: string = ""
  @Input() comparisonCol: string = ""

  form = this.fb.group({
    selectedColumn: ['', Validators.required],
  })

  categoryMap: any = {}
  categories: string[] = []
  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal) {
    this.form.controls.selectedColumn.valueChanges.subscribe((value) => {
      if (value && this.data) {
        this.data.forEach((row) => {
          const primaryID = row[this.primaryIDColumn]
          const comparison = "1"
          if (row[this.comparisonCol]) {
            const comparison: string = row[this.comparisonCol]
          }
          const category = row[value]
          const title = `${value} ${category} (${comparison})`
          if (!this.categoryMap[title]) {
            this.categoryMap[title] = {
              count: 1,
              color: "",
              comparison: comparison,
              primaryIDs: [primaryID]
            }
          } else {
            this.categoryMap[title].count++
            this.categoryMap[title].primaryIDs.push(primaryID)
          }
        })
        this.categories = Object.keys(this.categoryMap)
      }
    })
  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    if (this.form.invalid) {
      return
    }
    this.activeModal.close({
      column: this.form.controls.selectedColumn.value,
      categoryMap: this.categoryMap
    })
  }

  removeGroup(category: string) {
    delete this.categoryMap[category]
    this.categories = Object.keys(this.categoryMap)
  }

}

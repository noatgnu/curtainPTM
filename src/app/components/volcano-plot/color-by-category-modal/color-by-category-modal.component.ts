import {Component, Input, OnInit} from '@angular/core';
import {DataFrame, IDataFrame} from "data-forge";
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {ColorPickerDirective} from "ngx-color-picker";

interface CategoryInfo {
  value: string
  count: number
  color: string
  primaryIDs: string[]
}

@Component({
    selector: 'app-color-by-category-modal',
    imports: [
        FormsModule,
        ColorPickerDirective,
        ReactiveFormsModule
    ],
    templateUrl: './color-by-category-modal.component.html',
    styleUrl: './color-by-category-modal.component.scss'
})
export class ColorByCategoryModalComponent implements OnInit {
  @Input() data: IDataFrame = new DataFrame()
  @Input() primaryIDColumn: string = ""
  @Input() comparisonCol: string = ""

  form = this.fb.group({
    selectedColumn: ['', Validators.required],
  })

  categoryMap: Map<string, CategoryInfo> = new Map()
  categories: CategoryInfo[] = []
  selectedColumn: string = ""

  private defaultColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
  ]

  constructor(private fb: FormBuilder, private activeModal: NgbActiveModal) {}

  ngOnInit() {
    this.form.controls.selectedColumn.valueChanges.subscribe((value) => {
      if (value && this.data) {
        this.selectedColumn = value
        this.buildCategoryMap(value)
      }
    })
  }

  buildCategoryMap(column: string) {
    this.categoryMap.clear()
    const tempMap = new Map<string, CategoryInfo>()

    this.data.forEach((row) => {
      const primaryID = row[this.primaryIDColumn]
      const categoryValue = row[column]

      if (categoryValue === null || categoryValue === undefined || categoryValue === '') {
        return
      }

      const key = String(categoryValue)
      if (!tempMap.has(key)) {
        tempMap.set(key, {
          value: key,
          count: 1,
          color: '',
          primaryIDs: [primaryID]
        })
      } else {
        const info = tempMap.get(key)!
        info.count++
        info.primaryIDs.push(primaryID)
      }
    })

    const sortedKeys = Array.from(tempMap.keys()).sort()
    sortedKeys.forEach((key, index) => {
      const info = tempMap.get(key)!
      info.color = this.defaultColors[index % this.defaultColors.length]
      this.categoryMap.set(key, info)
    })

    this.categories = Array.from(this.categoryMap.values())
  }

  generateRandomColor(): string {
    const hue = Math.floor(Math.random() * 360)
    return `hsl(${hue}, 70%, 50%)`
  }

  assignRandomColors() {
    this.categories.forEach((cat, index) => {
      cat.color = this.generateRandomColor()
    })
  }

  assignSequentialColors() {
    this.categories.forEach((cat, index) => {
      cat.color = this.defaultColors[index % this.defaultColors.length]
    })
  }

  close() {
    this.activeModal.dismiss()
  }

  submit() {
    if (this.form.invalid || this.categories.length === 0) {
      return
    }

    const result: any = {}
    this.categories.forEach(cat => {
      const title = `${this.selectedColumn}: ${cat.value}`
      result[title] = {
        count: cat.count,
        color: cat.color,
        comparison: "1",
        primaryIDs: cat.primaryIDs
      }
    })

    this.activeModal.close({
      column: this.selectedColumn,
      categoryMap: result
    })
  }

  removeCategory(cat: CategoryInfo) {
    this.categoryMap.delete(cat.value)
    this.categories = Array.from(this.categoryMap.values())
  }
}

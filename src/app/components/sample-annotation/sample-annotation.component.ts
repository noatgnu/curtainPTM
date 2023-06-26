import { Component, OnInit } from '@angular/core';
import {DataService} from "../../data.service";
import {NgbActiveModal} from "@ng-bootstrap/ng-bootstrap";
import {SettingsService} from "../../settings.service";
import {WebService} from "../../web.service";
import {Project} from "../../classes/project";
import {getPrideData} from "curtain-web-api";
import {FormBuilder} from "@angular/forms";
import {debounceTime, distinctUntilChanged, map, Observable} from "rxjs";

@Component({
  selector: 'app-sample-annotation',
  templateUrl: './sample-annotation.component.html',
  styleUrls: ['./sample-annotation.component.scss']
})
export class SampleAnnotationComponent implements OnInit {
  samples: any[] = []

  project: Project = new Project()
  prideID: string = ""

  cellTypes: string[] = []
  diseases: string[] = []
  instruments: string[] = []
  modification: string[] = []
  msMethods: string[] = []
  species: string[] = []
  tissues: string[] = []
  projecttag: string[] = []
  quantification: string[] = []

  form = this.fb.group({
    accession: [""],
    title: [""],
    description: [""],
    sampleProcessingProtocol: [""],
    dataProcessingProtocol: [""],
    affiliations: [[],],
    instrument: [[],],
    softwares: [[],],
    experimentTypes: [[],],
    quantification: [[],],
    organisms: [[],],
    organismParts: [[],],
    diseases: [[],],
    authors: [[],],
    modification: [[],],
  })

  constructor(private fb: FormBuilder, private data: DataService, public modal: NgbActiveModal, private settings: SettingsService, private web: WebService) {
    for (const s in this.data.sampleMap) {
      if (!this.samples.includes(this.data.sampleMap[s].condition)) {
        this.samples.push(this.data.sampleMap[s].condition)
        if (this.settings.settings.project.sampleAnnotations[this.data.sampleMap[s].condition]) {
          this.project.sampleAnnotations[this.data.sampleMap[s].condition] = this.settings.settings.project.sampleAnnotations[this.data.sampleMap[s].condition].slice()
        } else {
          this.project.sampleAnnotations[this.data.sampleMap[s].condition] = this.data.sampleMap[s].condition
        }
      }
    }
    this.web.getPRIDEConstants("celltype").subscribe((data: any) => {
      this.cellTypes = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })
    this.web.getPRIDEConstants("disease").subscribe((data: any) => {
      this.diseases = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })
    this.web.getPRIDEConstants("instrument").subscribe((data: any) => {
      this.instruments = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })
    this.web.getPRIDEConstants("modification").subscribe((data: any) => {
      this.modification = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })
    this.web.getPRIDEConstants("msmethod").subscribe((data: any) => {
      this.msMethods = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })
    this.web.getPRIDEConstants("projecttag").subscribe((data: any) => {
      this.projecttag = data.split("\n")
    })
    this.web.getPRIDEConstants("quantification").subscribe((data: any) => {
      this.quantification = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })
    this.web.getPRIDEConstants("species").subscribe((data: any) => {
      this.species = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })
    this.web.getPRIDEConstants("tissue").subscribe((data: any) => {
      this.tissues = data.split("\n").map((d: string) => {
        return d.split("\t")[3]
      })
    })

  }

  ngOnInit(): void {
  }

  getPride() {
    getPrideData(this.prideID).then(data => {
      let currentAuthors: any[] = []
      for (const i in data.data) {
        switch (i) {
          case "accession":
            this.form.controls["accession"].setValue(data.data[i])
            this.project.accession = data.data[i]
            break
          case "title":
            this.form.controls["title"].setValue(data.data[i])
            this.project.title = data.data[i]
            break
          case "projectDescription":
            this.form.controls["description"].setValue(data.data[i])
            this.project.projectDescription = data.data[i]
            break
          case "sampleProcessingProtocol":
            this.form.controls["sampleProcessingProtocol"].setValue(data.data[i])
            this.project.sampleProcessingProtocol = data.data[i]
            break
          case "dataProcessingProtocol":
            this.form.controls["dataProcessingProtocol"].setValue(data.data[i])
            this.project.dataProcessingProtocol = data.data[i]
            break

          case "affiliations":
            this.form.controls["affiliations"].setValue(data.data[i])
            this.project.affiliations = data.data[i]
            break

          case "instruments":
            this.form.controls["instrument"].setValue(data.data[i])
            this.project.instruments = data.data[i]

            break
          case "softwares":
            this.form.controls["softwares"].setValue(data.data[i])
            this.project.softwares = data.data[i]

            break
          case "experimentTypes":
            this.form.controls["experimentTypes"].setValue(data.data[i])
            this.project.msMethods = data.data[i]
            break
          case "quantificationMethods":
            this.form.controls["quantification"].setValue(data.data[i])
            this.project.quantificationMethods = data.data[i]
            break
          case "organisms":
            this.form.controls["organisms"].setValue(data.data[i])
            this.project.organisms = data.data[i]
            break
          case "organismParts":
            this.form.controls["organismParts"].setValue(data.data[i])
            this.project.organismParts = data.data[i]
            break
          case "diseases":
            this.form.controls["diseases"].setValue(data.data[i])
            this.project.diseases = data.data[i]
            break
          case "submitters":
            for (const a of data.data[i]) {
              currentAuthors.push(a)
            }
            break
          case "identifiedPTMStrings":
            this.form.controls["modification"].setValue(data.data[i])
            this.project.identifiedPTMStrings = data.data[i]
            break

          case "_links":
            // @ts-ignore
            this.project[i] = data.data[i]
            if (Object.keys(this.project[i]).length>0) {
              this.project.hasLink = true
            }
            break
          default:
            // @ts-ignore
            //this.project[i] = data.data[i]
            break
        }
      }
      // @ts-ignore
      this.form.controls["authors"].setValue(currentAuthors)
      this.project.authors = currentAuthors
    })
  }

  addOrganism() {
    this.project.organisms.push({name: ""})
  }

  addOrganismPart() {
    this.project.organismParts.push({name: ""})
  }

  addInstruments() {
    this.project.instruments.push({cvLabel: "", name: ""})
  }

  addAffiliations() {
    this.project.affiliations.push({name: ""})
  }

  addPTMs() {
    this.project.identifiedPTMStrings.push({name: ""})
  }

  addDiseases() {
    this.project.diseases.push({name: ""})
  }

  addAuthors() {
    this.project.authors.push({name: ""})
  }

  addCellTypes() {
    this.project.cellTypes.push({name: ""})
  }

  addQuantificationMethods() {
    this.project.quantificationMethods.push({name: ""})
  }

  addProjectTags() {
    this.project.projectTags.push({name: ""})
  }

  addExperimentTypes() {
    this.project.msMethods.push({name: ""})
  }

  addSoftwares() {
    this.project.softwares.push({name: ""})
  }
  searchTypeAheadCellType = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.cellTypes.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadDisease = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.diseases.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadInstrument = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.instruments.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadModification = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.modification.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadMSMethod = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.msMethods.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadProjectTag = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.projecttag.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadQuantification = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.quantification.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadSpecies = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.species.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }

  searchTypeAheadTissue = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length == 0 ? []
        : this.tissues.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    )
  }
}


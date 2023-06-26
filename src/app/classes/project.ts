import {FactoryTarget} from "@angular/compiler";

export class Project {
  title: string = ""
  projectDescription: string = ""
  organisms: any[] = [
    {name: ""}
  ]
  organismParts: any[] = [
    {name: ""}
  ]
  cellTypes: any[] = [
    {name: ""}
  ]
  diseases: any[] = [
    {name: ""}
  ]

  sampleProcessingProtocol: string = ""
  dataProcessingProtocol: string = ""
  identifiedPTMStrings: any[] = [{
    name: ""
  }]

  instruments: any[] = [
    {cvLabel: "MS", name: ""}
  ]

  msMethods: any[] = [
    {name: ""}
  ]

  projectTags: any[] = [
    {name: ""}
  ]

  quantificationMethods: any[] = [
    {name: ""}
  ]

  species: any[] = [
    {name: ""}
  ]

  sampleAnnotations: any = {}
  _links: any = {datasetFtpUrl: {href: ""}, files: {href: ""}, self: {href: ""}}
  affiliations: any[] = [{
    name: ""
  }]
  hasLink: boolean = false
  authors: any[] = []
  accession: string = ""
  softwares: any[] = [
    {name: ""}
  ]
}

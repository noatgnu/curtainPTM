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
  sampleProcessingProtocol: string = ""
  dataProcessingProtocol: string = ""
  identifiedPTMStrings: any[] = [{
    name: ""
  }]

  instruments: any[] = [
    {cvLabel: "MS", name: ""}
  ]
  publicationDate: any = {}
  sampleAnnotations: any = {}
  _links: any = {datasetFtpUrl: {href: ""}, files: {href: ""}, self: {href: ""}}
  affiliations: any[] = [{
    name: ""
  }]
  hasLink: boolean = false
}

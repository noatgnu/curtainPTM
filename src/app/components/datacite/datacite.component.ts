import {Component, Input} from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from "@angular/forms";
import {AccountsService} from "../../accounts/accounts.service";
import {WebService} from "../../web.service";
import {OrcidPublicRecord} from "../../orcid-public-record";
import {catchError, debounceTime, distinctUntilChanged, map, Observable, of, switchMap} from "rxjs";
import {NgbActiveModal, NgbCollapse, NgbHighlight, NgbTypeahead} from "@ng-bootstrap/ng-bootstrap";
import {languages} from "./languages";
import {fosData} from "./subjects";
import {licenses} from "./licenses";
import {DataciteService} from "./data-cite.service";
import {environment} from "../../../environments/environment";
import {ToastService} from "../../toast.service";
import {QuillModule} from "ngx-quill";
import {DataCiteCurtain} from "../../data-cite-metadata";
import {NgClass} from "@angular/common";

@Component({
  selector: 'app-datacite',
  imports: [
    ReactiveFormsModule,
    NgbTypeahead,
    FormsModule,
    NgbHighlight,
    QuillModule,
    NgbCollapse,
    NgClass
  ],
  templateUrl: './datacite.component.html',
  styleUrl: './datacite.component.scss'
})
export class DataciteComponent {
  isCollapsedFunding = true;
  isCollapsedAdditionalData = false;
  isCollapsedDescriptions = true;
  isCollapsedRelatedIds = true;
  isCollapsedAlternateIds = true;
  isCollapsedContributors = true;
  isCollapsedSubjects = true;
  isCollapsedRights = true;
  isCollapsedInfo = false;
  isCollapsedCreators = true;
  isCollapsedTitle = true;
  isCollapsedPublishing = true;
  private _linkID: string = ""
  private baseURL: string = environment.apiURL
  @Input() set linkID(value: string) {
    this._linkID = value
    this.dataCiteForm.controls.alternateIdentifiers.at(0).controls.alternateIdentifier.setValue(`${this.baseURL}curtain/${this._linkID}/download/token=/`)
  }
  get linkID(): string {
    return this._linkID
  }
  private _dataCiteMetadata?: DataCiteCurtain
  @Input() set dataCiteMetadata(value: DataCiteCurtain) {
    if (this.dataCiteForm.controls.alternateIdentifiers) {
      if (this.dataCiteForm.controls.alternateIdentifiers.at(0)) {
        if (this.dataCiteForm.controls.alternateIdentifiers.at(0).controls.alternateIdentifier.value) {
          // @ts-ignore
          if (this.dataCiteForm.controls.alternateIdentifiers.at(0).controls.alternateIdentifier.value.includes(this._linkID)) {
            console.log(value)
            this.dataCiteForm.patchValue(value.form_data)
            this._dataCiteMetadata = value
            this.adminForm.controls.status.setValue(value.status)
          }
        }
      }
    }
  }

  get dataCiteMetadata(): DataCiteCurtain {
    return this._dataCiteMetadata!
  }

  private _lock: boolean = false
  @Input() set lock(value: boolean) {
    if (this.dataCiteForm.controls.alternateIdentifiers) {
      if (this.dataCiteForm.controls.alternateIdentifiers.at(0)) {
        if (this.dataCiteForm.controls.alternateIdentifiers.at(0).controls.alternateIdentifier.value) {
          // @ts-ignore
          if (this.dataCiteForm.controls.alternateIdentifiers.at(0).controls.alternateIdentifier.value.includes(this._linkID)) {
            this._lock = value
            if (this._lock) {
              this.disableForm()
            } else {
              this.enableForm()
            }
            this.adminForm.controls.lock.setValue(value)
          }
        }
      }
    }

  }

  get lock(): boolean {
    return this._lock
  }

  nameTypes: string[] = ["Personal", "Organizational"]
  identifierTypes: string[] =  ["ARK", "arXiv", "bibcode", "DOI", "EAN13", "EISSN", "Handle", "IGSN", "ISBN", "ISSN", "ISTC", "LISSN", "LSID", "PMID", "PURL", "UPC", "URL", "URN", "w3id"]
  identifierRelationTypes: string[] = ["Cites", "IsCitedBy", "Compiles", "IsCompiledBy", "Continues", "IsContinuedBy", "Describes", "IsDescribedBy", "Documents", "IsDocumentedBy", "IsDerivedFrom", "IsSourceOf", "HasMetadata", "IsMetadataFor", "HasPart", "IsPartOf", "IsSupplementedBy", "IsSupplementTo", "Obsoletes", "IsObsoletedBy", "References", "IsReferencedBy", "Requires", "IsRequiredBy", "Reviews", "IsReviewedBy", "HasVersion", "IsVersionOf", "IsNewVersionOf", "IsPreviousVersionOf", "IsPublishedIn", "IsVariantFormOf", "IsOriginalFormOf", "IsIdenticalTo", "IsCollectedBy", "Collects"]
  resourceTypes: string[] = ["Audiovisual", "Collection", "DataPaper", "Dataset", "Event", "Image", "InteractiveResource", "Model", "PhysicalObject", "Service", "Software", "Sound", "Text", "Workflow", "Other"]
  descriptionTypes: string[] = ["Abstract", "Methods", "SeriesInformation", "TableOfContents", "TechnicalInfo", "Other"]
  funderIdentifierTypes: string[] = ["Crossref Funder ID", "GRID", "ISNI", "ROR", "Other"]
  informationIsTrue: boolean = false
  dataCiteForm = this.fb.group({
    schemaVersion: ["http://datacite.org/schema/kernel-4", Validators.required],
    prefix: ['', Validators.required],
    suffix: ['', Validators.required],
    url: ['', Validators.required],
    creators: this.fb.array([
      this.fb.group({
        givenName: ['',],
        familyName: ['',],
        name: ['', Validators.required],
        nameType: ['Personal', Validators.required],
        nameIdentifiers: this.fb.array(
          [
            this.fb.group({
              schemeUri: ["https://orcid.org/"],
              nameIdentifier: [""],
              nameIdentifierScheme: ["ORCID"],
            })
          ]
        ),
        affiliation: this.fb.array([
          this.fb.group({
            name: [{disabled: true, value: ''}, Validators.required],
            affiliationIdentifier: [{disabled: true, value: ''},],
            affiliationIdentifierScheme: [{disabled: true, value: ''},],
            schemeUri: [{disabled: true, value: ''},]
          })
        ])
      })
    ]),
    titles: this.fb.array([
      this.fb.group({
        title: ['', Validators.required],
        lang: ['en', Validators.required]
      })
    ]),
    publisher: this.fb.group({
      name:  ['University of Dundee', Validators.required],
      publisherIdentifier: ['https://ror.org/03h2bxq36', Validators.required],
      publisherIdentifierScheme: ['ROR', Validators.required],
      schemeUri: ['https://ror.org/', Validators.required]
    }),
    publicationYear: [new Date().getFullYear().toString(), Validators.required],
    types: this.fb.group({
      resourceTypeGeneral: ['Dataset', Validators.required],
      resourceType: ['Interactive visualization of differential analysis datasets', Validators.required]
    }),
    subjects: this.fb.array([
      this.fb.group(
        {subject: ["Biological sciences", Validators.required], subjectScheme:
            ["OECD REVISED FIELD OF SCIENCE AND TECHNOLOGY (FOS) CLASSIFICATION IN THE FRASCATI\n" +
            "MANUAL", Validators.required],
          valueUri: ["https://unstats.un.org/wiki/download/attachments/101354089/FOS.pdf?api=v2", Validators.required]
        }
      ),
    ]),
    contributors: this.fb.array([
      this.fb.group({
        name: ["",],
        affiliation: this.fb.array([
          this.fb.group({
            name: [{disabled: true, value: ''}, Validators.required,],
            affiliationIdentifierScheme: [{disabled: true, value: ''}, ],
            affiliationIdentifier: [{disabled: true, value: ''}, ],
            schemeUri: [{disabled: true, value: ''}, ]
          })
        ]),
        givenName: [""],
        familyName: [""],
        nameIdentifiers: this.fb.array(
          [
            this.fb.group({
              schemeUri: ["https://orcid.org/"],
              nameIdentifier: [""],
              nameIdentifierScheme: ["ORCID"],
            })
          ]
        ),
        nameType: ["Personal", Validators.required],

      })
    ]),
    descriptions: this.fb.array([
      this.fb.group({
        description: ['', Validators.required],
        descriptionType: ['Abstract', Validators.required]
      }),
      this.fb.group({
        description: ['', Validators.required],
        descriptionType: ['Methods', Validators.required]
      })
    ]),
    rightsList: this.fb.array([
      this.fb.group({
        rights: ["Creative Commons Attribution 4.0 International", Validators.required],
        rightsUri: ["https://creativecommons.org/licenses/by/4.0/legalcode", Validators.required],
      })
    ]),
    alternateIdentifiers: this.fb.array([
      this.fb.group({
        alternateIdentifier: ['', Validators.required],
        alternateIdentifierType: ['Direct data access URL', Validators.required]
      })
    ]),
    relatedIdentifiers: this.fb.array([
      this.fb.group(
        {
          relatedIdentifier: ['',],
          relatedIdentifierType: ['', ],
          relationType: ['', ],
          relatedMetadataScheme: ['', ],
          schemeUri: ["",],
          schemeType: ["",],
          resourceTypeGeneral: ['', ],
        }
      )]),
    fundingReferences: this.fb.array([
      this.fb.group({
        funderName: [{disabled: true, value: ''},],
        funderIdentifier: [{disabled: true, value: ''},],
        funderIdentifierType: [{disabled: true, value: ''},],
        awardNumber: [{disabled: true, value: ''},],
        awardUri: [{disabled: true, value: ''}, ],
        awardTitle: [{disabled: true, value: ''},],
      })
    ]),
  });

  permissionToken: string = ""
  permissionTokenLastUpdated: Date = new Date()

  dataCiteQuota: number = 0
  dataCiteMaxQuota: number = 0

  form_additional_data = this.fb.group({
    pii_statement: ['', Validators.required],
    publicationRights: [false, Validators.requiredTrue],
    informationIsTrue: [false, Validators.requiredTrue],
    contact_email: ['', [Validators.email, Validators.required]],
    asapPolicy: [false, Validators.requiredTrue],
  })

  adminForm = this.fb.group({
    "status": ["pending", Validators.required],
    "lock": [true, Validators.required],
  })

  get affiliations(): string[] {
    const creators = this.dataCiteForm.controls.creators.controls.flatMap(c => c.controls.affiliation.controls.map(a => a.controls.name.value)).filter(aff => aff !== null);
    const contributors = this.dataCiteForm.controls.contributors.controls.flatMap(c => c.controls.affiliation.controls.map(a => a.controls.name.value)).filter(aff => aff !== null);
    return [...new Set([...creators, ...contributors])];
  }

  constructor(private toastService: ToastService, private modal: NgbActiveModal, private fb: FormBuilder, public accountsService: AccountsService, private web: WebService, private dataciteService: DataciteService) {
    if (!this.accountsService.isOwner) {
      this.dataCiteForm.disable()
    }
    this.accountsService.curtainAPI.getDataCiteQuota().then((value) => {
      this.dataCiteQuota = value.data.quota
      this.dataCiteMaxQuota = value.data.max_quota
    })
    for (const c of this.dataCiteForm.controls.creators.controls) {
      for (const n of c.controls.nameIdentifiers.controls) {
        n.controls.nameIdentifier.valueChanges.subscribe((value) => {
          if (!value) {
            return
          }
          this.accountsService.curtainAPI.getDataCiteProxyOrcidPublicRecord(value).then((publicRecord: any)=> {
            const orcidData = publicRecord.data as OrcidPublicRecord
            c.controls.givenName.setValue(orcidData.names.givenNames.value)
            c.controls.familyName.setValue(orcidData.names.familyName.value)
            c.controls.name.setValue(orcidData.names.creditName.value)
          })
        })
      }

    }
    for (const c of this.dataCiteForm.controls.contributors.controls) {
      for (const n of c.controls.nameIdentifiers.controls) {
        n.controls.nameIdentifier.valueChanges.subscribe((value) => {
          if (!value) {
            return
          }
          this.accountsService.curtainAPI.getDataCiteProxyOrcidPublicRecord(value).then((publicRecord: any)=> {
            const orcidData = publicRecord.data as OrcidPublicRecord
            c.controls.givenName.setValue(orcidData.names.givenNames.value)
            c.controls.familyName.setValue(orcidData.names.familyName.value)
            c.controls.name.setValue(orcidData.names.creditName.value)
          })
        })
      }
    }
    for (const c of this.dataCiteForm.controls.rightsList.controls) {
      c.controls.rights.valueChanges.subscribe((value) => {
        if (!value) {
          return
        }
        const license = this.getLicenseOptions().filter((license) => {
          return license.name === value
        })
        if (license.length > 0) {
          c.controls.rightsUri.setValue(license[0].seeAlso[0])
        }
      })
    }
    this.accountsService.curtainAPI.getRandomDataCiteSuffix().then((value) => {
      this.dataCiteForm.controls.suffix.setValue("curtain."+value.data.suffix)
      // update permission token
      this.accountsService.curtainAPI.getDataCiteTimeLimitedPermissionToken(value.data.suffix).then((value) => {
        this.permissionToken = value.data.token
        this.permissionTokenLastUpdated = new Date()
      })
      this.dataCiteForm.controls.prefix.setValue(value.data.prefix)
      this.dataCiteForm.controls.url.setValue(location.origin+"/#/"+encodeURIComponent(`doi.org/${value.data.prefix}/curtain.${value.data.suffix}`))
    })
    // update permission token every 5 minutes
    setInterval(() => {
      if (!this.dataCiteForm.controls.suffix.value) {
        return
      }
      this.accountsService.curtainAPI.getDataCiteTimeLimitedPermissionToken(this.dataCiteForm.controls.suffix.value).then((value) => {
        this.permissionToken = value.data.token
        this.permissionTokenLastUpdated = new Date()
      })
    }, 300000)

  }

  onSubmit(mode: "create"| "update" = "create") {
    if (!this.accountsService.isOwner) {
      return
    }
    if (!this.form_additional_data.value.informationIsTrue) {
      return
    }
    const dataCiteMetadata = this.dataCiteForm.value;
    if (dataCiteMetadata.creators) {
      for (let i = 0; i < dataCiteMetadata.creators.length; i++) {
        if (dataCiteMetadata.creators[i].name === "") {
          this.toastService.show("DOI Form Error", "Please fill in all fields for metadata creators", 5000, "error").then()
        }
        const affiliation = dataCiteMetadata.creators[i].affiliation
        if (affiliation) {
          const checkedAffiliation = affiliation.filter((aff) => aff.name !== "")
          if (checkedAffiliation.length === 0) {
            delete dataCiteMetadata.creators[i].affiliation
          }
        }

      }
    }
    if (dataCiteMetadata.titles) {
      for (let i = 0; i < dataCiteMetadata.titles.length; i++) {
        if (dataCiteMetadata.titles[i].title === "") {
          this.toastService.show("DOI Form Error", "Please fill in all fields for metadata titles", 5000, "error").then()
        }
      }
    }
    if (dataCiteMetadata.contributors) {

      for (let i = 0; i < dataCiteMetadata.contributors.length; i++) {
        if (dataCiteMetadata.contributors[i].name === "" && dataCiteMetadata.contributors.length > 1) {
          this.toastService.show("DOI Form Error", "Please fill in all fields for metadata contributors or remove them", 5000, "error").then()
          return;
        }
        const affiliation = dataCiteMetadata.contributors[i].affiliation
        if (affiliation) {
          const checkedAffiliation = affiliation.filter((aff) => aff.name !== "")
          if (checkedAffiliation.length === 0) {
            delete dataCiteMetadata.contributors[i].affiliation
          }
        }
      }
      if (dataCiteMetadata.contributors.length == 1) {
        if (dataCiteMetadata.contributors[0].name === "") {
          delete dataCiteMetadata.contributors
        }
      }
    }
    if (dataCiteMetadata.subjects) {
      for (let i = 0; i < dataCiteMetadata.subjects.length; i++) {
        if (dataCiteMetadata.subjects[i].subject === "") {
          this.toastService.show("DOI Form Error", "Please fill in all fields for metadata subjects", 5000, "error").then()
        }
      }
    }
    if (dataCiteMetadata.descriptions) {
      for (let i = 0; i < dataCiteMetadata.descriptions.length; i++) {
        if (dataCiteMetadata.descriptions[i].description === "") {
          this.toastService.show("DOI Form Error", "Please fill in all fields for metadata descriptions", 5000, "error").then()
        }
      }
    }
    if (dataCiteMetadata.fundingReferences) {
      const checkedFundingReferences = dataCiteMetadata.fundingReferences.filter((fundingReference) => fundingReference.funderName !== "")
      if (checkedFundingReferences.length === 0) {
        delete dataCiteMetadata.fundingReferences
      }
    }

    if (dataCiteMetadata.relatedIdentifiers) {
      for (let i = 0; i < dataCiteMetadata.relatedIdentifiers.length; i++) {
        if (dataCiteMetadata.relatedIdentifiers[i].relationType !== "HasMetadata" && dataCiteMetadata.relatedIdentifiers[i].relationType !== "IsMetadataFor") {
          delete dataCiteMetadata.relatedIdentifiers[i].relatedMetadataScheme
          delete dataCiteMetadata.relatedIdentifiers[i].schemeUri
          delete dataCiteMetadata.relatedIdentifiers[i].schemeType
        } else {
          if (dataCiteMetadata.relatedIdentifiers[i].relatedMetadataScheme === "" || dataCiteMetadata.relatedIdentifiers[i].schemeUri === "" || dataCiteMetadata.relatedIdentifiers[i].schemeType === "" || dataCiteMetadata.relatedIdentifiers[i].relatedIdentifier === "") {
            this.toastService.show("DOI Form Error", "Please fill in all fields for metadata related identifiers", 5000, "error").then()
            return;
          }
        }

      }
    }
    if (this.form_additional_data.invalid) {
      this.toastService.show("DOI Form Error", "Please fill in all fields for additional data", 5000, "error").then()
      return;
    }
    const payload = {
      "token": this.permissionToken,
      "form": dataCiteMetadata,
      "linkID": this.linkID,
      "pii_statement": this.form_additional_data.controls.pii_statement.value,
      "contact_email": this.form_additional_data.controls.contact_email.value
    }
    if (mode === "create") {
      this.accountsService.curtainAPI.submitDataCite(payload).then((value) => {
        this.toastService.show("DOI Created", `Your ${value.data["doi"]} has been created in drafting status before approval`, 5000, "success").then()
        this.modal.close(value.data)

      }).catch((error) => {
        this.toastService.show("DOI Error", "There is an error submitting data to the server", 5000, "error").then()
      })
    } else {
      if (this.dataCiteMetadata) {
        this.accountsService.curtainAPI.updateDataCite(this.dataCiteMetadata.id, payload).then((value) => {
          this.dataCiteMetadata = value.data
          this.toastService.show("DOI Updated", `Your ${value.data["doi"]} has been updated`, 5000, "success").then()
        }).catch((error) => {
          this.toastService.show("DOI Error", "There is an error submitting data to the server", 5000, "error").then()
        })
      }

    }


  }

  addCreator() {
    const form = this.fb.group({
      givenName: ['',],
      familyName: ['',],
      name: ['', Validators.required],
      affiliation: this.fb.array([
        this.fb.group({
          name: [{disabled: true, value: ''}, Validators.required,],
          affiliationIdentifier: [{disabled: true, value: ''}, ],
          affiliationIdentifierScheme: [{disabled: true, value: ''}, ],
          schemeUri: [{disabled: true, value: ''},]
        })
      ]),
      nameType: ['Personal', Validators.required],
      nameIdentifiers: this.fb.array(
        [
          this.fb.group({
            schemeUri: ["https://orcid.org/"],
            nameIdentifier: [""],
            nameIdentifierScheme: ["ORCID"],
          })
        ]
      )

    })
    form.controls.nameIdentifiers.controls[0].controls.nameIdentifier.valueChanges.subscribe((value) => {
      if (!value) {
        return
      }
      this.accountsService.curtainAPI.getDataCiteProxyOrcidPublicRecord(value).then((publicRecord: any)=> {
        const orcidData = publicRecord.data as OrcidPublicRecord
        form.controls.givenName.setValue(orcidData.names.givenNames.value)
        form.controls.familyName.setValue(orcidData.names.familyName.value)
        form.controls.name.setValue(orcidData.names.creditName.value)
      })
    })
    this.dataCiteForm.controls.creators.push(form);
  }

  searchAffiliations = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term =>
        this.dataciteService.getROR(term).pipe(
          map((response: any) => response.items)
        )
      )
    );

  onAffiliationSelect(event: any, type: "creators"|"contributors", creatorIndex: number, affiliationIndex: number) {
    const item = event.item;
    const affiliation = this.dataCiteForm.controls[type].at(creatorIndex).controls.affiliation.at(affiliationIndex);
    affiliation.controls.name.setValue(item.name);
    affiliation.controls.affiliationIdentifier.setValue(item.id);
    affiliation.controls.affiliationIdentifierScheme.setValue("ROR");
    affiliation.controls.schemeUri.setValue("https://ror.org/");
  }

  searchFunder = (text$: Observable<string>): Observable<any[]> => {
    return text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term =>
        this.dataciteService.getFunder(term).pipe(
          map((response:any) => response.message.items),
          catchError(() => of([]))
        )
      )
    );
  }

  getLanguageOptions() {
    return Object.entries(languages).map(([key, value]) => {
      return {key: key, value: value}
    })
  }

  getSubjectOptions() {
    return fosData.fosFields
  }

  addSubject() {
    this.dataCiteForm.controls.subjects.push(this.fb.group({
      subject: ["", Validators.required],
      subjectScheme: ["OECD REVISED FIELD OF SCIENCE AND TECHNOLOGY (FOS) CLASSIFICATION IN THE FRASCATI MANUAL", Validators.required],
      valueUri: ["https://unstats.un.org/wiki/download/attachments/101354089/FOS.pdf?api=v2", Validators.required]
    }))
  }

  getLicenseOptions() {
    return licenses.filter((license) => {
      return ["CC-BY-NC-4.0", "CC-BY-4.0", "CC-BY-NC-ND-4.0"].includes(license.licenseId)
    })
  }

  addContributor() {
    const form = this.fb.group({
      name: ["",],
      affiliation: this.fb.array([
        this.fb.group({
          name: [{disabled: true, value: ''}, Validators.required, ],
          affiliationIdentifierScheme: [{disabled: true, value: ''},],
          affiliationIdentifier: [{disabled: true, value: ''}, ],
          schemeUri: [{disabled: true, value: ''},]
        })
      ]),
      givenName: [""],
      familyName: [""],
      nameIdentifiers: this.fb.array(
        [
          this.fb.group({
            schemeUri: ["https://orcid.org/"],
            nameIdentifier: [""],
            nameIdentifierScheme: ["ORCID"],
          })
        ]
      ),
      nameType: ["Personal", Validators.required],
    })
    form.controls.nameIdentifiers.controls[0].controls.nameIdentifier.valueChanges.subscribe((value) => {
      if (!value) {
        return
      }
      this.accountsService.curtainAPI.getDataCiteProxyOrcidPublicRecord(value).then((publicRecord: any)=> {
        const orcidData = publicRecord.data as OrcidPublicRecord
        form.controls.givenName.setValue(orcidData.names.givenNames.value)
        form.controls.familyName.setValue(orcidData.names.familyName.value)
        form.controls.name.setValue(orcidData.names.creditName.value)
      })
    })
    this.dataCiteForm.controls.contributors.push(form)

  }

  addRelatedIdentifier(identifierSource: string) {
    switch (identifierSource) {
      case "PRIDE":
        this.dataCiteForm.controls.relatedIdentifiers.push(this.fb.group({
          relatedIdentifier: ["", Validators.required],
          relatedIdentifierType: ["URL", Validators.required],
          relationType: ["Is supplement to", Validators.required],
          relatedMetadataScheme: ["",],
          schemeUri: ["",],
          schemeType: ["",],
          resourceTypeGeneral: ["Dataset", Validators.required],
        }))
        break
      case "SDRF-Proteomics":
        this.dataCiteForm.controls.relatedIdentifiers.push(this.fb.group({
          relatedIdentifier: ["", Validators.required],
          relatedIdentifierType: ["URL", Validators.required],
          relationType: ["HasMetadata", Validators.required],
          relatedMetadataScheme: ["SDRF-Proteomics",],
          schemeUri: ["https://github.com/bigbio/proteomics-sample-metadata/blob/master/sdrf-proteomics/README.adoc",],
          schemeType: ["",],
          resourceTypeGeneral: ["Dataset", Validators.required],
        }))
        break
      default:
        this.dataCiteForm.controls.relatedIdentifiers.push(this.fb.group({
          relatedIdentifier: ["", Validators.required],
          relatedIdentifierType: ["", Validators.required],
          relationType: ["", Validators.required],
          relatedMetadataScheme: ["",],
          schemeUri: ["",],
          schemeType: ["",],
          resourceTypeGeneral: ["", Validators.required],
        }))
    }
  }

  removeRelatedIdentifier(index: number) {
    this.dataCiteForm.controls.relatedIdentifiers.removeAt(index);
  }

  checkHasMetadataScheme(index: number) {
    return this.dataCiteForm.controls.relatedIdentifiers.controls[index].controls.relationType.value === "HasMetadata" || this.dataCiteForm.controls.relatedIdentifiers.controls[index].controls.relationType.value === "IsMetadataFor"
  }

  removeCreator(index: number) {
    this.dataCiteForm.controls.creators.removeAt(index);
  }

  removeContributor(index: number) {
    this.dataCiteForm.controls.contributors.removeAt(index);
  }

  addDescription() {
    this.dataCiteForm.controls.descriptions.push(this.fb.group({
      description: ['', Validators.required],
      descriptionType: ['', Validators.required]
    }))
  }

  removeFundingReference(index: number) {
    this.dataCiteForm.controls.fundingReferences.removeAt(index);
  }

  onFunderSelect(event: any, index: number) {
    const item = event.item;
    const fundingReference = this.dataCiteForm.controls.fundingReferences.at(index);
    fundingReference.controls.funderName.setValue(item.name);
    fundingReference.controls.funderIdentifier.setValue(item.uri);
    fundingReference.controls.funderIdentifierType.setValue("Crossref Funder ID");
    //fundingReference.controls.schemeUri.setValue("https://www.crossref.org/services/funder-registry/");
  }

  resultFormatter = (result: any) => result.name;
  inputFormatter = (result: any) => result.name;
  resultTemplate = (result: any) => result.name;
  addFundingReference() {
    this.dataCiteForm.controls.fundingReferences.push(this.fb.group({
      funderName: [{disabled: true, value: ''},],
      funderIdentifier: [{disabled: true, value: ''}, ],
      funderIdentifierType: [{disabled: true, value: ''}, ],
      awardNumber: [{disabled: true, value: ''}, ],
      awardUri: [{disabled: true, value: ''},],
      awardTitle: [{disabled: true, value: ''}, ],
    }))
  }

  close() {
    this.modal.dismiss()
  }

  exportJSON() {
    const dataCiteMetadata: any = this.dataCiteForm.value;
    const data = JSON.stringify(dataCiteMetadata, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'datacite-doi-form.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  importJSON(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(reader.result as string);
      // patch all but prefix, suffix, url, publisher, publisherIdentifier, publicationYear, and alternateIdentifiers
      for (const key of Object.keys(data)) {
        if (key !== "prefix" && key !== "suffix" && key !== "url" && key !== "publisher" && key !== "publisherIdentifier" && key !== "publicationYear" && key !== "alternateIdentifiers") {
          // @ts-ignore
          this.dataCiteForm.controls[key].patchValue(data[key]);
        }
      }
    }
    reader.readAsText(file);
  }

  removeAffiliation(type: "creators"|"contributors", contributorIndex: number, affiliationIndex: number) {
    this.dataCiteForm.controls[type].controls[contributorIndex].controls.affiliation.removeAt(affiliationIndex);
  }
  addAffiliation(type: "creators"|"contributors", contributorIndex: number) {
    this.dataCiteForm.controls[type].controls[contributorIndex].controls.affiliation.push(this.fb.group({
      name: [{disabled: true, value: ''}, Validators.required,],
      affiliationIdentifier: [{disabled: true, value: ''},],
      affiliationIdentifierScheme: [{disabled: true, value: ''},],
      schemeUri: [{disabled: true, value: ''},]
    }))
  }

  disableForm() {
    this.form_additional_data.disable()
  }

  enableForm() {
    this.form_additional_data.enable()
  }

  lockForm() {
    this.accountsService.curtainAPI.lockDataCite(this.dataCiteMetadata.id, true).then((value) => {
      this.lock = true
      this.form_additional_data.controls.informationIsTrue.setValue(false)
      this.form_additional_data.disable()
    })
  }

  unlockForm() {
    this.accountsService.curtainAPI.lockDataCite(this.dataCiteMetadata.id, false).then((value) => {
      this.lock = false
      this.form_additional_data.enable()
    })
  }

  approveDOI() {
    this.accountsService.curtainAPI.changeDataCiteStatus(this.dataCiteMetadata.id, "published").then((value) => {
      this.dataCiteMetadata.status = "published"
    })
  }

  rejectDOI() {
    this.accountsService.curtainAPI.changeDataCiteStatus(this.dataCiteMetadata.id, "rejected").then((value) => {
      this.dataCiteMetadata.status = "rejected"
    })
  }

  removeSubject(index: number) {
    this.dataCiteForm.controls.subjects.removeAt(index);
  }

  removeDescription(index: number) {
    this.dataCiteForm.controls.descriptions.removeAt(index);
  }

  addAlternateIdentifier() {
    this.dataCiteForm.controls.alternateIdentifiers.push(this.fb.group({
      alternateIdentifier: ['', Validators.required],
      alternateIdentifierType: ['', Validators.required]
    }))
  }

  removeAlternateIdentifier(index: number) {
    if (index > 0 && this.dataCiteForm.controls.alternateIdentifiers.length > 1) {
      this.dataCiteForm.controls.alternateIdentifiers.removeAt(index);
    }
  }
}

import {HttpClient, HttpHeaders} from "@angular/common/http";
import {interval, Subject} from "rxjs";

export class UniprotParser {
  baseURL: string = "https://rest.uniprot.org/idmapping/run"
  checkStatusURL: string = "https://rest.uniprot.org/idmapping/status/"
  format: string = "tsv"
  columns: string = "accession,id,gene_names,protein_name,organism_name,organism_id,length,xref_refseq,go_id,go_p,go_c,go_f,cc_subcellular_location,ft_topo_dom,ft_carbohyd,mass,cc_mass_spectrometry,sequence,ft_var_seq,cc_alternative_products,cc_function,ft_domain,xref_string,ft_mod_res"
  jobCollections: any[] = []
  pollInterval: any
  result: Subject<string> = new Subject<string>()
  http: HttpClient

  constructor(http: HttpClient) {
    this.http = http
  }

  toParamString(options: Map<string, string>): string {
    const pArray: string[] = [];
    options.forEach((value, key) => {
      pArray.push(encodeURI(key + '=' + value));
    });

    return pArray.join('&');
  }

  async processData(data: string[]) {
    this.jobCollections = []
    const totalNumber = data.length
    for (let i = 0; i < totalNumber; i = i + 500) {
      let subset: string[] = []
      if ((i + 500) <= totalNumber) {
        subset = data.slice(i, i + 500)
      } else {
        subset = data.slice(i)
      }
      const jobId = await this.postJob(subset)
      await new Promise(resolve => setTimeout(resolve, 2000))
      this.jobCollections.push({jobId: jobId, completed: false, started: false})
    }
  }

  async get_uniprot() {
    let jobN = this.jobCollections.length
    this.pollInterval = interval(5000).subscribe(_ => {
        for (const j of this.jobCollections) {
          if (!j.completed) {
            if (!j.started) {
              j.started = true
              this.http.get(this.checkStatusURL + j.jobId, {observe: "response"}).subscribe(data => {
                const a = data.headers.get("X-Total-Results")
                if (a) {
                  j.completed = true
                  const options: Map<string, string> = new Map<string, string>(
                    [["format", this.format], ["size", "500"], ["fields", this.columns], ["includeIsoform", "false"]]
                  )
                  this.http.get(data.url + "/?" + this.toParamString(options), {
                    responseType: "text",
                    observe: "body"
                  }).subscribe(
                    data => {
                      jobN--
                      this.result.next(data)
                    }
                  )
                  if (jobN === 0) {
                    this.pollInterval.unsubscribe()
                  }
                } else {
                  j.started = false
                }
              })
            }

          }
        }
      }
    )
  }

  async postJob(data: string[]) {
    let body = new URLSearchParams([
      ["ids", data.join(",")], ["from", "UniProtKB_AC-ID"], ["to", "UniProtKB"]
    ])

    const res = await this.http.post(
      this.baseURL,
      body.toString(),
      {observe: "body", responseType: "json", headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')}).toPromise()
    if (res) {
      // @ts-ignore
      return res["jobId"]
    }
  }
}

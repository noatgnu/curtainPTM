import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {WebService} from "./web.service";
import {fromCSV} from "data-forge";
import {BehaviorSubject, Subject} from "rxjs";
import {Parser, Accession} from "uniprotparserjs";
import {UniprotDb} from "./classes/uniprot-db";

@Injectable({
  providedIn: 'root'
})
export class UniprotService {
  run = 0
  public Re = /([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})(-\d+)?/;
  results: Map<string, any> = new Map<string, any>()
  dataMap: Map<string, any> = new Map<string, any>()
  db: Map<string, any> = new Map<string, any>()
  organism = ""
  uniprotParseStatus = new BehaviorSubject<boolean>(false)
  uniprotProgressBar = new Subject<any>()
  accMap: Map<string, string> = new Map<string, string>()
  geneNameToPrimary: any = {}
  constructor(private http: HttpClient) { }

  async UniprotParserJS(accList: string[]) {
    const parser = new Parser(5, "accession,id,gene_names,protein_name,organism_name,organism_id,length,cc_subcellular_location,sequence,ft_var_seq,cc_alternative_products,ft_domain,xref_string,ft_mod_res,cc_function,cc_disease,cc_pharmaceutical,ft_mutagen,xref_mim")
    //randomly shuffle the array
    accList.sort(() => Math.random() - 0.5);
    const res = await parser.parse(accList, 5000)
    let currentRun = 1
    let totalRun = 0
    let currentSegment = 0
    for await (const r of res) {
      if (currentSegment === 0) {
        totalRun = Math.ceil(r.total/500)
      }
      if (currentSegment !== r.segment) {
        totalRun = totalRun + Math.ceil(r.total/500)
        currentSegment = r.segment
      }

      this.uniprotProgressBar.next({value: currentRun * 100/totalRun, text: `Processed UniProt Job ${currentRun}/${totalRun} (Segment ${r.segment/5000+1})`})
      await this.PrimeProcessReceivedData(r.data)
      if (currentRun === totalRun) {
        this.uniprotParseStatus.next(true)
      } else {
        currentRun ++
      }
    }
  }


  async PrimeProcessReceivedData(data: string) {
    // @ts-ignore
    const df = fromCSV(data, {delimiter: '\t'});
    this.organism = df.first()["Organism (ID)"]
    for (const r of df) {
      if (r["Gene Names"]) {
        r["Gene Names"] = r["Gene Names"].replaceAll(" ", ";").toUpperCase()
      }
      if (r["Subcellular location [CC]"]) {
        const ind = r["Subcellular location [CC]"].indexOf("Note=")
        if (ind > -1) {
          r["Subcellular location [CC]"] = r["Subcellular location [CC]"].slice(0, ind)
        }
        const subLoc = []
        for (const s of r["Subcellular location [CC]"].split(/[.;]/g)) {
          if (s !== "") {
            let su = s.replace(/\s*\{.*?\}\s*/g, "")
            su = su.split(": ")
            const a = su[su.length-1].trim()
            if (a !== "") {
              subLoc.push(a.slice())
            }
          }
        }
        r["Subcellular location [CC]"] = subLoc
      }
      const isoforms: string[] = []
      if (r["Alternative products (isoforms)"]) {
        for (const iso of r["Alternative products (isoforms)"].split(/[; ]/g)) {
          if (iso.startsWith("IsoId=")) {
            isoforms.push(iso.slice(6))
          }
        }
        r["Alternative products (isoforms)"] = isoforms
      }
      if (r["Modified residue"]) {
        const mods = r["Modified residue"].split("; ")
        let modRes: any[] = []
        let modPosition = -1
        let modType = ""
        for (const m of mods) {

          if (m.startsWith("MOD_RES")) {
            modPosition = parseInt(m.split(" ")[1]) -1
          } else if (m.indexOf("note=") > -1) {
            const modre = /".+"/.exec(m)
            if (modre !== null) {
              modType = modre[0]
              modRes.push({position: modPosition+1, residue: r["Sequence"][modPosition], modType: modType.replace(/"/g, "")})
            }
          }
        }

        r["Modified residue"] = modRes
      }
      if (r["Domain [FT]"]) {
        let domains: any[] = []
        let l: number = 0;
        for (const s of r["Domain [FT]"].split(/;/g)) {
          if (s !== "") {
            if (s.indexOf("DOMAIN") > -1) {
              domains.push({})
              l = domains.length
              for (const match of s.matchAll(/(\d+)/g)) {
                if (!("start" in domains[l-1])) {
                  domains[l-1].start = parseInt(match[0])
                } else {
                  domains[l-1].end = parseInt(match[0])
                }
              }
            } else if (s.indexOf("/note=") > -1) {
              const match = /"(.+)"/.exec(s)
              if (match !== null) {
                domains[l-1].name = match[1]
              }
            }
          }
        }
        r["Domain [FT]"] = domains
      }
      if (r["Mutagenesis"]) {
        let mutagenesis: any[] = []
        let position = ""
        for (const s of r["Mutagenesis"].split(/; /g)) {
          if (s!== "") {
            if (s.indexOf("MUTAGEN") > -1) {
              position = s.split(" ")[1]
            } else if (s.indexOf("/note=") > -1) {
              const match = /"(.+)"/.exec(s)
              if (match !== null) {
                mutagenesis.push({position: position, note: match[1]})
              }
            }
          }
        }
        r["Mutagenesis"] = mutagenesis
      }
      this.db.set(r["Entry"], r)

      this.dataMap.set(r["From"], r["Entry"])
      this.dataMap.set(r["Entry"], r["Entry"])
      if (this.accMap.has(r["Entry"])) {
        const a = this.accMap.get(r["Entry"])
        // @ts-ignore
        const query = a.replace(",", ";")
        for (const q of query.split(";")) {
          this.dataMap.set(q, r["Entry"])
        }
      }
    }
  }


  getUniprotFromAcc(accession_id: string) {
    if (this.accMap.has(accession_id)) {
      const a = this.accMap.get(accession_id)
      if (a) {
        if (this.dataMap.has(a)) {
          const ac = this.dataMap.get(a)
          if (ac) {
            return this.db.get(ac)
          }
        }
      }
    }
    return null
  }

  getUniprotFasta(accession_id: string) {
    return this.http.get("https://rest.uniprot.org/uniprotkb/"+accession_id+".fasta", {responseType: "text", observe: "body"})
  }

  parseFasta(data: string) {
    const lines = data.split("\n")
    let seq = ""
    for (const line of lines) {
      if (!line.startsWith(">")) {
        seq = seq + line
      }
    }
    return seq
  }

  *parseMultiFasta(data: string) {
    const multiFastaMap = new Map<string, string>()
    const lines = data.split("\n")
    let seq: string = ""
    let id: string = ""
    for (const line of lines) {
      if (!line.startsWith(">")) {
        seq = seq + line
      } else {
        if (id !== "") {
          yield {id: id.slice(), seq: seq.slice()}
        }

        id = line.slice(1)
        const acc = new Accession(id, true)
        if (acc.acc !== "" && acc.acc !== null && acc.acc !== undefined) {
          id = acc.toString()
        }
        seq = ""

      }
    }
    if (id !== "") {
      yield {id: id.slice(), seq: seq.slice()}
    }
  }
}

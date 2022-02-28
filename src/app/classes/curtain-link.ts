import {environment} from "../../environments/environment";

export class CurtainLink {
  proxyURL: string = environment.apiURL
  stringURL: string = "http://string-db.org/"
  uniprotBASE: string = "https://www.uniprot.org/uploadlists/?"
  ebiAlphaFoldURL: string = "https://alphafold.ebi.ac.uk/"
  interactomeAtlas: string = "http://www.interactome-atlas.org/app.php/"
}

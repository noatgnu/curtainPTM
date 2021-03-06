export class Settings {
  fetchUniprot: boolean = true
  inputDataCols: any = {}
  probabilityFilterMap: any = {}
  pCutoff: number = 0.05
  log2FCCutoff: number = 0.6
  description: string = ""
  uniprot: boolean = true
  colorMap: any = {}
  academic: boolean = true
  backGroundColorGrey: boolean = false
  currentComparison: string = ""
  enableDB: any = {
    PSP_PHOSPHO: true,
    PLMD_UBI: true,
    CDB_CARBONYL: true
  }
}

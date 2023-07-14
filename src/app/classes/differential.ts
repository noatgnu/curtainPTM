export class Differential {
  get reverseFoldChange(): boolean {
    return this._reverseFoldChange;
  }

  set reverseFoldChange(value: boolean) {
    this._reverseFoldChange = value;
  }
  get sequence(): string {
    return this._sequence;
  }

  set sequence(value: string) {
    this._sequence = value;
  }
  get accession(): string {
    return this._accession;
  }

  set accession(value: string) {
    this._accession = value;
  }

  get position(): string {
    return this._position;
  }

  set position(value: string) {
    this._position = value;
  }

  get positionPeptide(): string {
    return this._positionPeptide;
  }

  set positionPeptide(value: string) {
    this._positionPeptide = value;
  }

  get peptideSequence(): string {
    return this._peptideSequence;
  }

  set peptideSequence(value: string) {
    this._peptideSequence = value;
  }

  get score(): string {
    return this._score;
  }

  set score(value: string) {
    this._score = value;
  }
  get comparisonSelect(): string {
    return this._comparisonSelect;
  }

  set comparisonSelect(value: string) {
    this._comparisonSelect = value;
  }
  get primaryIDs(): string {
    return this._primaryIDs;
  }

  set primaryIDs(value: string) {
    this._primaryIDs = value;
  }

  get geneNames(): string {
    return this._geneNames;
  }

  set geneNames(value: string) {
    this._geneNames = value;
  }

  get foldChange(): string {
    return this._foldChange;
  }

  set foldChange(value: string) {
    this._foldChange = value;
  }

  get transformFC(): boolean {
    return this._transformFC;
  }

  set transformFC(value: boolean) {
    this._transformFC = value;
  }

  get significant(): string {
    return this._significant;
  }

  set significant(value: string) {
    this._significant = value;
  }

  get transformSignificant(): boolean {
    return this._transformSignificant;
  }

  set transformSignificant(value: boolean) {
    this._transformSignificant = value;
  }

  get comparison(): string {
    return this._comparison;
  }

  set comparison(value: string) {
    this._comparison = value;
  }
  private _primaryIDs: string = "Unique identifier"
  private _geneNames: string = ""
  private _foldChange: string = "Difference: WT/KD"
  private _transformFC: boolean = false
  private _significant: string = "p-value: WT/KD"
  private _transformSignificant: boolean = false
  private _comparison: string = "Comparison"
  private _comparisonSelect: string = ""

  private _accession: string = "Protein"
  private _position: string = "Position"
  private _positionPeptide: string = "Position in peptide"
  private _peptideSequence: string = "Phospho (STY) Probabilities"
  private _score: string = "Localization prob"
  private _sequence: string = "Sequence window"
  private _reverseFoldChange: boolean = false
  restore(value: any) {
    for (const i in value) {
      // @ts-ignore
      this[i] = value[i]
    }
  }
}

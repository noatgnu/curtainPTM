/// <reference lib="webworker" />

import { fromCSV, IDataFrame, Series } from "data-forge";

interface DifferentialForm {
  _primaryIDs: string;
  _geneNames: string;
  _foldChange: string;
  _significant: string;
  _comparison: string;
  _comparisonSelect: string;
  _transformFC: boolean;
  _transformSignificant: boolean;
  _reverseFoldChange: boolean;
  _accession: string;
  _position: string;
  _positionPeptide: string;
  _peptideSequence: string;
  _score: string;
  _sequence: string;
}

interface RawForm {
  _primaryIDs: string;
  _samples: string[];
}

interface Settings {
  conditionOrder: string[];
  sampleOrder: Record<string, string[]>;
  sampleVisible: Record<string, boolean>;
  sampleMap: Record<string, SampleInfo>;
  colorMap: Record<string, string>;
  defaultColorList: string[];
}

interface SampleInfo {
  replicate: string;
  condition: string;
  name: string;
}

interface WorkerMessage {
  task: 'processDifferentialFile' | 'processRawFile';
  differential?: string;
  differentialForm?: DifferentialForm;
  raw?: string;
  rawForm?: RawForm;
  settings?: Settings;
}

interface ProgressMessage {
  type: 'progress';
  value: number;
  text: string;
}

interface ErrorMessage {
  type: 'error';
  message: string;
  details?: string;
}

interface DifferentialResultMessage {
  type: 'resultDifferential';
  differential: string;
  differentialForm: DifferentialForm;
}

interface RawResultMessage {
  type: 'resultRaw';
  raw: string;
  settings: Settings;
  conditions: string[];
}

type WorkerResponse = ProgressMessage | ErrorMessage | DifferentialResultMessage | RawResultMessage;

const PROGRESS_BATCH_SIZE = 500;

addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { task } = event.data;

  try {
    switch (task) {
      case 'processDifferentialFile':
        processDifferentialFile(event.data);
        break;
      case 'processRawFile':
        processRawFile(event.data);
        break;
      default:
        postError(`Unknown task: ${task}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    postError(message);
  }
});

function postProgress(value: number, text: string): void {
  const message: ProgressMessage = { type: 'progress', value, text };
  postMessage(message);
}

function postError(message: string, details?: string): void {
  const errorMessage: ErrorMessage = { type: 'error', message, details };
  postMessage(errorMessage);
}

function processDifferentialFile(data: WorkerMessage): void {
  if (!data.differential || !data.differentialForm) {
    postError('Missing differential data or form configuration');
    return;
  }

  const validationErrors = validateDifferentialForm(data.differentialForm);
  if (validationErrors.length > 0) {
    postError('Validation failed', validationErrors.join('; '));
    return;
  }

  postProgress(0, 'Parsing differential data...');

  let df: IDataFrame = fromCSV(data.differential);
  const form = data.differentialForm;

  df = ensureComparisonColumn(df, form);

  postProgress(20, 'Processing rows...');

  const totalRows = df.count();
  const rows = df.toArray();
  const store: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = processRow(rows[i], form);
    store.push(row);

    if (i % PROGRESS_BATCH_SIZE === 0) {
      const progress = 20 + (i / totalRows) * 70;
      postProgress(progress, `Processing row ${i + 1} of ${totalRows}...`);
    }
  }

  postProgress(95, 'Finalizing...');

  const result: DifferentialResultMessage = {
    type: 'resultDifferential',
    differential: JSON.stringify(store),
    differentialForm: form
  };

  postProgress(100, 'Finished processing differential data');
  postMessage(result);
}

function validateDifferentialForm(form: DifferentialForm): string[] {
  const errors: string[] = [];

  if (!form._foldChange) {
    errors.push('Fold change column is required');
  }
  if (!form._significant) {
    errors.push('Significance column is required');
  }
  if (!form._primaryIDs) {
    errors.push('Primary ID column is required');
  }

  return errors;
}

function ensureComparisonColumn(df: IDataFrame, form: DifferentialForm): IDataFrame {
  if (!form._comparison || form._comparison === '' || form._comparison === 'CurtainSetComparison') {
    form._comparison = 'CurtainSetComparison';
    form._comparisonSelect = '1';
    return df.withSeries('CurtainSetComparison', new Series(Array(df.count()).fill('1'))).bake();
  }

  if (form._comparisonSelect === '' || form._comparisonSelect === undefined) {
    if (df.getColumnNames().includes(form._comparison)) {
      form._comparisonSelect = df.first()[form._comparison];
    } else {
      form._comparison = 'CurtainSetComparison';
      form._comparisonSelect = '1';
      return df.withSeries('CurtainSetComparison', new Series(Array(df.count()).fill('1'))).bake();
    }
  }

  return df;
}

function processRow(row: any, form: DifferentialForm): any {
  row[form._position] = parseArrayField(row[form._position], 'number');
  row[form._positionPeptide] = parseArrayField(row[form._positionPeptide], 'number');
  row[form._foldChange] = transformFoldChange(
    Number(row[form._foldChange]),
    form._transformFC,
    form._reverseFoldChange
  );
  row[form._score] = Number(row[form._score]);
  row[form._significant] = transformSignificance(
    Number(row[form._significant]),
    form._transformSignificant
  );
  row[form._peptideSequence] = parseArrayField(row[form._peptideSequence], 'string', true);

  if (form._sequence) {
    row[form._sequence] = parseArrayField(row[form._sequence], 'string');
  }

  return row;
}

function transformFoldChange(value: number, transform: boolean, reverse: boolean): number {
  let result = value;

  if (transform) {
    if (result > 0) {
      result = Math.log2(result);
    } else if (result < 0) {
      result = -Math.log2(Math.abs(result));
    } else {
      result = 0;
    }
  }

  if (reverse) {
    result = -result;
  }

  return result;
}

function transformSignificance(value: number, transform: boolean): number {
  if (transform) {
    return -Math.log10(value);
  }
  return value;
}

function processRawFile(data: WorkerMessage): void {
  if (!data.raw || !data.rawForm || !data.settings) {
    postError('Missing raw data, form configuration, or settings');
    return;
  }

  const validationErrors = validateRawForm(data.rawForm);
  if (validationErrors.length > 0) {
    postError('Validation failed', validationErrors.join('; '));
    return;
  }

  postProgress(0, 'Parsing raw data...');

  const rawDF: IDataFrame = fromCSV(data.raw);
  const samples = data.rawForm._samples.slice();
  const settings = data.settings;

  postProgress(20, 'Processing samples...');

  const { conditions, colorMap, sampleMap } = processSamples(samples, settings);

  postProgress(40, 'Updating settings...');

  updateSettings(settings, conditions, colorMap, sampleMap);

  postProgress(60, 'Processing data rows...');

  const totalRows = rawDF.count();
  const rows = rawDF.toArray();
  const storeRaw: any[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (const s of samples) {
      row[s] = Number(row[s]);
    }
    storeRaw.push(row);

    if (i % PROGRESS_BATCH_SIZE === 0) {
      const progress = 60 + (i / totalRows) * 35;
      postProgress(progress, `Processing row ${i + 1} of ${totalRows}...`);
    }
  }

  postProgress(100, 'Finished processing raw data');

  const result: RawResultMessage = {
    type: 'resultRaw',
    raw: JSON.stringify(storeRaw),
    settings: settings,
    conditions: conditions
  };

  postMessage(result);
}

function validateRawForm(form: RawForm): string[] {
  const errors: string[] = [];

  if (!form._primaryIDs) {
    errors.push('Primary ID column is required');
  }
  if (!form._samples || form._samples.length === 0) {
    errors.push('At least one sample column is required');
  }

  return errors;
}

interface ProcessSamplesResult {
  conditions: string[];
  colorMap: Record<string, string>;
  sampleMap: Record<string, SampleInfo>;
}

function processSamples(samples: string[], settings: Settings): ProcessSamplesResult {
  const conditions: string[] = [];
  const colorMap: Record<string, string> = {};
  const sampleMap: Record<string, SampleInfo> = {};
  let colorPosition = 0;

  for (const sample of samples) {
    const parts = sample.split('.');
    const replicate = parts[parts.length - 1];
    const condition = parts.slice(0, parts.length - 1).join('.');

    if (!conditions.includes(condition)) {
      conditions.push(condition);

      if (colorPosition >= settings.defaultColorList.length) {
        colorPosition = 0;
      }
      colorMap[condition] = settings.defaultColorList[colorPosition];
      colorPosition++;
    }

    if (!settings.sampleOrder[condition]) {
      settings.sampleOrder[condition] = [];
    }
    if (!settings.sampleOrder[condition].includes(sample)) {
      settings.sampleOrder[condition].push(sample);
    }

    if (!(sample in settings.sampleVisible)) {
      settings.sampleVisible[sample] = true;
    }

    sampleMap[sample] = { replicate, condition, name: sample };
  }

  return { conditions, colorMap, sampleMap };
}

function updateSettings(
  settings: Settings,
  conditions: string[],
  colorMap: Record<string, string>,
  sampleMap: Record<string, SampleInfo>
): void {
  if (Object.keys(settings.sampleMap).length === 0) {
    settings.sampleMap = sampleMap;
  }

  cleanupSampleVisible(settings, sampleMap);
  cleanupSampleMap(settings, sampleMap);
  updateColorMap(settings, colorMap);
  updateConditionOrder(settings, conditions);
}

function cleanupSampleVisible(settings: Settings, sampleMap: Record<string, SampleInfo>): void {
  for (const sample in settings.sampleVisible) {
    if (!(sample in sampleMap)) {
      delete settings.sampleVisible[sample];
    }
  }
}

function cleanupSampleMap(settings: Settings, sampleMap: Record<string, SampleInfo>): void {
  for (const sample in settings.sampleMap) {
    if (!(sample in sampleMap)) {
      delete settings.sampleMap[sample];
    }
  }
}

function updateColorMap(settings: Settings, colorMap: Record<string, string>): void {
  for (const condition in colorMap) {
    if (!(condition in settings.colorMap)) {
      settings.colorMap[condition] = colorMap[condition];
    }
  }
}

function updateConditionOrder(settings: Settings, conditions: string[]): void {
  if (settings.conditionOrder.length === 0) {
    settings.conditionOrder = conditions.slice();
  } else {
    const existingOrder = settings.conditionOrder.slice();
    const newOrder: string[] = [];

    for (const condition of existingOrder) {
      if (conditions.includes(condition)) {
        newOrder.push(condition);
      }
    }

    for (const condition of conditions) {
      if (!newOrder.includes(condition)) {
        newOrder.push(condition);
      }
    }

    settings.conditionOrder = newOrder;
  }
}

function parseArrayField(value: string, type: 'number' | 'string', cleanSequence: boolean = false): any {
  if (!value || value === '') {
    return type === 'number' ? [] : [];
  }

  const parts = value.split(';').map(part => part.trim()).filter(part => part !== '');

  if (parts.length === 1) {
    if (type === 'number') {
      const num = Number(parts[0]);
      return isNaN(num) ? [parts[0]] : num;
    } else {
      return cleanSequence ? parseSequenceSingle(parts[0]) : parts[0];
    }
  }

  if (type === 'number') {
    return parts.map(part => {
      const num = Number(part);
      return isNaN(num) ? part : num;
    });
  } else {
    return cleanSequence ? parts.map(part => parseSequenceSingle(part)) : parts;
  }
}

function parseSequenceSingle(value: string): string {
  let depth = 0;
  let sequence = '';

  for (const char of value) {
    if (['(', '[', '{'].includes(char)) {
      depth++;
    } else if ([')', ']', '}'].includes(char)) {
      depth--;
    } else if (depth === 0) {
      sequence += char;
    }
  }

  return sequence;
}

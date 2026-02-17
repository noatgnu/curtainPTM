import { Settings } from '../classes/settings';

export interface SavedStateMetadata {
  id: string | number;
  name: string;
  description: string;
  tags: string[];
  date: number;
  currentID: string;
  selectedComparison?: string;
  isAutoSave: boolean;
  version: number;
}

export interface SavedState extends SavedStateMetadata {
  settings: Partial<Settings>;
  data: {
    selectedMap: any;
    selected: any;
    selectOperationNames: string[];
  };
}

export interface StateCategory {
  key: string;
  label: string;
  description: string;
  settingsKeys: string[];
  isDataCategory?: boolean;
}

export interface StatePreview {
  metadata: SavedStateMetadata;
  categorySummary: CategorySummary[];
  totalSettingsCount: number;
  selectionsCount: number;
}

export interface CategorySummary {
  category: StateCategory;
  itemCount: number;
  hasData: boolean;
}

export interface StateDiff {
  added: DiffItem[];
  removed: DiffItem[];
  changed: DiffItem[];
}

export interface DiffItem {
  category: string;
  key: string;
  oldValue?: any;
  newValue?: any;
}

export interface ExportOptions {
  pretty: boolean;
  categories?: string[];
}

export const STATE_CATEGORIES: StateCategory[] = [
  {
    key: 'colors',
    label: 'Color Settings',
    description: 'Color maps for volcano, bar charts, networks',
    settingsKeys: [
      'colorMap',
      'barchartColorMap',
      'stringDBColorMap',
      'interactomeAtlasColorMap',
      'networkInteractionSettings',
      'proteomicsDBColor',
      'defaultColorList'
    ]
  },
  {
    key: 'selections',
    label: 'Selections & Groups',
    description: 'Selected PTMs and operation names',
    settingsKeys: [],
    isDataCategory: true
  },
  {
    key: 'cutoffs',
    label: 'Analysis Cutoffs',
    description: 'P-value and fold change thresholds',
    settingsKeys: [
      'pCutoff',
      'log2FCCutoff',
      'probabilityFilterMap'
    ]
  },
  {
    key: 'volcano',
    label: 'Volcano Plot Settings',
    description: 'Axis, dimensions, annotations, shapes',
    settingsKeys: [
      'volcanoAxis',
      'volcanoPlotTitle',
      'volcanoPlotDimension',
      'volcanoPlotGrid',
      'volcanoAdditionalShapes',
      'textAnnotation',
      'volcanoConditionLabels',
      'volcanoTraceOrder',
      'markerSizeMap',
      'scatterPlotMarkerSize',
      'volcanoPlotLegendX',
      'volcanoPlotLegendY',
      'volcanoPlotYaxisPosition'
    ]
  },
  {
    key: 'samples',
    label: 'Sample Configuration',
    description: 'Sample order, visibility, conditions',
    settingsKeys: [
      'sampleOrder',
      'sampleVisible',
      'conditionOrder',
      'sampleMap'
    ]
  },
  {
    key: 'charts',
    label: 'Chart Settings',
    description: 'Bar chart, violin plot configurations',
    settingsKeys: [
      'barChartConditionBracket',
      'columnSize',
      'chartYAxisLimits',
      'individualYAxisLimits',
      'violinPointPos',
      'plotFontFamily'
    ]
  }
];

export const CURRENT_STATE_VERSION = 2;

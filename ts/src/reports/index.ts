/**
 * Report classes for specific filing types.
 */

export { BaseReport, type ReportOptions, type SectionNameMapping } from './base.js';
export { TenK } from './ten-k.js';
export { TenQ, type StructureInfo, type StructureItem } from './ten-q.js';
export { EightK, normalizeItemNumber } from './eight-k.js';
export {
  FilingStructure,
  ItemOnlyFilingStructure,
  type ItemDefinition,
  type PartStructure,
  type StructureDefinition,
  isValidItemForFiling,
  extractItemsFromSections,
  TEN_K_STRUCTURE,
  TEN_Q_STRUCTURE,
} from './structures.js';

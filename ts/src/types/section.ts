/**
 * Section types for document section extraction.
 */

import type { INode } from './nodes.js';

export type DetectionMethod = 'toc' | 'heading' | 'pattern';

export interface Section {
  /** Normalized section name (e.g., 'item_1', 'item_1a') */
  name: string;

  /** Display title (e.g., 'Item 1 - Business') */
  title: string;

  /** Start node in document tree */
  startNode?: INode;

  /** End node in document tree */
  endNode?: INode;

  /** Detection confidence (0.0 - 1.0) */
  confidence: number;

  /** How the section was detected */
  detectionMethod: DetectionMethod;

  /** Extract text content from section */
  text(): string;
}

export type Sections = Map<string, Section>;

export interface SectionPattern {
  pattern: RegExp;
  title: string;
}

export interface SectionPatterns {
  [sectionName: string]: SectionPattern[];
}

export interface DetectionThresholds {
  tocConfidence: number;
  headingConfidence: number;
  patternConfidence: number;
  enableCrossValidation: boolean;
}

export const DEFAULT_DETECTION_THRESHOLDS: DetectionThresholds = {
  tocConfidence: 0.95,
  headingConfidence: 0.7,
  patternConfidence: 0.6,
  enableCrossValidation: true,
};

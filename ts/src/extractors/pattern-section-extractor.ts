/**
 * Pattern-based section extraction.
 */

import type { Document } from '../types/document.js';
import type { Section, Sections, SectionPatterns } from '../types/section.js';
import type { IHeadingNode, INode } from '../types/nodes.js';
import { TEN_K_PATTERNS } from './patterns/ten-k.js';

/**
 * Section implementation for pattern-based extraction.
 */
class PatternSection implements Section {
  name: string;
  title: string;
  startNode?: INode;
  endNode?: INode;
  confidence: number;
  detectionMethod: 'pattern' = 'pattern';

  private doc: Document;
  private _text?: string;

  constructor(
    name: string,
    title: string,
    startNode: INode | undefined,
    confidence: number,
    doc: Document
  ) {
    this.name = name;
    this.title = title;
    this.startNode = startNode;
    this.confidence = confidence;
    this.doc = doc;
  }

  text(): string {
    if (this._text !== undefined) {
      return this._text;
    }

    if (!this.startNode) {
      this._text = '';
      return this._text;
    }

    // Extract text from start to end node
    this._text = this.extractSectionText();
    return this._text;
  }

  private extractSectionText(): string {
    if (!this.startNode) return '';

    const parts: string[] = [];
    let started = false;
    const startLevel = (this.startNode as IHeadingNode).level || 1;

    const traverse = (node: INode): boolean => {
      if (node === this.startNode) {
        started = true;
        return true;
      }

      if (!started) return true;

      // Stop at next section heading
      if (node.type === 'heading') {
        const level = (node as IHeadingNode).level || 1;
        if (level <= startLevel) {
          return false;
        }
      }

      const text = node.text().trim();
      if (text) {
        parts.push(text);
      }

      return true;
    };

    const walk = (node: INode): boolean => {
      if (!traverse(node)) return false;
      for (const child of node.children) {
        if (!walk(child)) return false;
      }
      return true;
    };

    walk(this.doc.root);

    return parts.join('\n\n');
  }
}

/**
 * Pattern-based section extractor.
 */
export class PatternSectionExtractor {
  private form: string;
  private patterns: SectionPatterns;

  constructor(form: string) {
    this.form = form.replace('/A', ''); // Normalize amendments
    this.patterns = this.getPatterns();
  }

  /**
   * Get patterns for the form type.
   */
  private getPatterns(): SectionPatterns {
    switch (this.form) {
      case '10-K':
        return TEN_K_PATTERNS;
      // Add other forms here
      default:
        return {};
    }
  }

  /**
   * Extract sections from document.
   */
  extract(document: Document): Sections {
    const sections: Sections = new Map();
    const headings = document.headings;

    for (const heading of headings) {
      const text = heading.text().trim();

      for (const [sectionName, patterns] of Object.entries(this.patterns)) {
        for (const pattern of patterns) {
          if (pattern.pattern.test(text)) {
            // Found a match
            if (!sections.has(sectionName)) {
              sections.set(
                sectionName,
                new PatternSection(
                  sectionName,
                  pattern.title,
                  heading,
                  0.70, // Pattern detection confidence
                  document
                )
              );
            }
            break;
          }
        }
      }
    }

    return sections;
  }

  /**
   * Match a single heading text against patterns.
   */
  matchSection(text: string): { name: string; title: string; confidence: number } | null {
    for (const [sectionName, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.pattern.test(text)) {
          return {
            name: sectionName,
            title: pattern.title,
            confidence: 0.70,
          };
        }
      }
    }
    return null;
  }
}

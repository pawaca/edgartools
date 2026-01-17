/**
 * Paragraph node for block text content.
 */

import type { Style, IParagraphNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class ParagraphNode extends Node implements IParagraphNode {
  readonly type = 'paragraph' as const;

  constructor(style?: Style) {
    super(style);
  }

  /**
   * Extract text with child content joined.
   */
  override text(): string {
    const parts: string[] = [];

    for (const child of this.children) {
      const childText = child.text();
      if (childText) {
        parts.push(childText);
      }
    }

    // Join inline content with spaces
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }
}

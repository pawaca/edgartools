/**
 * Document root node.
 */

import type { Style, IDocumentNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class DocumentNode extends Node implements IDocumentNode {
  readonly type = 'document' as const;

  constructor(style?: Style) {
    super(style);
  }

  /**
   * Extract text with proper spacing.
   */
  override text(): string {
    const parts: string[] = [];

    for (const child of this.children) {
      const childText = child.text();
      if (childText.trim()) {
        parts.push(childText);
      }
    }

    return parts.join('\n\n');
  }
}

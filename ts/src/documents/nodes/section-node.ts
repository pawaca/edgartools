/**
 * Section node for document sections.
 */

import type { Style, ISectionNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class SectionNode extends Node implements ISectionNode {
  readonly type = 'section' as const;
  name?: string;

  constructor(name?: string, style?: Style) {
    super(style);
    this.name = name;
  }

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

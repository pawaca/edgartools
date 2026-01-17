/**
 * Container node for div and other block containers.
 */

import type { Style, IContainerNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class ContainerNode extends Node implements IContainerNode {
  readonly type = 'container' as const;
  tagName?: string;

  constructor(tagName?: string, style?: Style) {
    super(style);
    this.tagName = tagName;
  }

  /**
   * Extract text from children.
   */
  override text(): string {
    const parts: string[] = [];

    for (const child of this.children) {
      const childText = child.text();
      if (childText.trim()) {
        parts.push(childText);
      }
    }

    return parts.join('\n');
  }
}

/**
 * Heading node for h1-h6 elements.
 */

import type { Style, IHeadingNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class HeadingNode extends Node implements IHeadingNode {
  readonly type = 'heading' as const;
  content: string;
  level: number;

  constructor(content: string, level: number, style?: Style) {
    super(style);
    this.content = content;
    this.level = Math.min(6, Math.max(1, level)); // Clamp to 1-6
  }

  /**
   * Return the heading text.
   */
  override text(): string {
    return this.content;
  }
}

/**
 * Text node for inline text content.
 */

import type { Style, ITextNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class TextNode extends Node implements ITextNode {
  readonly type = 'text' as const;
  content: string;

  constructor(content: string, style?: Style) {
    super(style);
    this.content = content;
  }

  /**
   * Return the text content.
   */
  override text(): string {
    return this.content;
  }
}

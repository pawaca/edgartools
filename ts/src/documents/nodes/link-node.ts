/**
 * Link node for anchor elements.
 */

import type { Style, ILinkNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class LinkNode extends Node implements ILinkNode {
  readonly type = 'link' as const;
  content: string;
  href: string;
  title?: string;

  constructor(content: string, href: string, title?: string, style?: Style) {
    super(style);
    this.content = content;
    this.href = href;
    this.title = title;
  }

  override text(): string {
    return this.content;
  }

  /**
   * Check if this is an internal anchor link.
   */
  isAnchorLink(): boolean {
    return this.href.startsWith('#');
  }

  /**
   * Get the anchor target (without #).
   */
  getAnchorTarget(): string | null {
    if (this.isAnchorLink()) {
      return this.href.substring(1);
    }
    return null;
  }
}

/**
 * List nodes for ul/ol and li elements.
 */

import type {
  Style,
  IListNode,
  IListItemNode,
} from '../../types/nodes.js';
import { Node } from './base.js';

export class ListItemNode extends Node implements IListItemNode {
  readonly type = 'listItem' as const;

  constructor(style?: Style) {
    super(style);
  }

  override text(): string {
    const parts: string[] = [];
    for (const child of this.children) {
      const childText = child.text();
      if (childText) {
        parts.push(childText);
      }
    }
    return parts.join(' ');
  }
}

export class ListNode extends Node implements IListNode {
  readonly type = 'list' as const;
  ordered: boolean;

  constructor(ordered: boolean = false, style?: Style) {
    super(style);
    this.ordered = ordered;
  }

  override text(): string {
    const items: string[] = [];

    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const childText = child.text();
      if (childText.trim()) {
        const prefix = this.ordered ? `${i + 1}. ` : '- ';
        items.push(prefix + childText);
      }
    }

    return items.join('\n');
  }
}

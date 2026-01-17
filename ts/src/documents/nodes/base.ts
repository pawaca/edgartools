/**
 * Base Node class for document tree structure.
 */

import type {
  INode,
  NodeType,
  SemanticType,
  Style,
  NodeMetadata,
} from '../../types/nodes.js';

export abstract class Node implements INode {
  abstract type: NodeType;
  children: INode[] = [];
  style?: Style;
  metadata: NodeMetadata = {};
  semanticType?: SemanticType;

  constructor(style?: Style) {
    this.style = style;
  }

  /**
   * Add a child node.
   */
  addChild(node: INode): void {
    this.children.push(node);
  }

  /**
   * Extract text content from this node and all children.
   */
  text(): string {
    const parts: string[] = [];

    for (const child of this.children) {
      const childText = child.text();
      if (childText) {
        parts.push(childText);
      }
    }

    return parts.join('');
  }

  /**
   * Find all nodes matching a predicate.
   */
  find(predicate: (node: INode) => boolean): INode[] {
    const results: INode[] = [];

    if (predicate(this)) {
      results.push(this);
    }

    for (const child of this.children) {
      results.push(...child.find(predicate));
    }

    return results;
  }

  /**
   * Set metadata value.
   */
  setMetadata(key: string, value: unknown): void {
    this.metadata[key] = value;
  }

  /**
   * Get metadata value.
   */
  getMetadata(key: string): unknown {
    return this.metadata[key];
  }

  /**
   * Get all descendant nodes.
   */
  descendants(): INode[] {
    const result: INode[] = [];

    for (const child of this.children) {
      result.push(child);
      if ('descendants' in child && typeof child.descendants === 'function') {
        result.push(...(child as Node).descendants());
      }
    }

    return result;
  }

  /**
   * Check if this node has any children.
   */
  hasChildren(): boolean {
    return this.children.length > 0;
  }

  /**
   * Check if this node is empty (no content).
   */
  isEmpty(): boolean {
    return this.text().trim().length === 0;
  }
}

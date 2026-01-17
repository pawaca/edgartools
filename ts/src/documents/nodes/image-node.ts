/**
 * Image node for img elements.
 */

import type { Style, IImageNode } from '../../types/nodes.js';
import { Node } from './base.js';

export class ImageNode extends Node implements IImageNode {
  readonly type = 'image' as const;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;

  constructor(
    options: {
      src?: string;
      alt?: string;
      width?: number;
      height?: number;
      style?: Style;
    } = {}
  ) {
    super(options.style);
    this.src = options.src;
    this.alt = options.alt;
    this.width = options.width;
    this.height = options.height;
  }

  override text(): string {
    // Return alt text if available
    return this.alt || '';
  }
}

/**
 * Table nodes for table elements.
 */

import type {
  Style,
  ITableNode,
  IRowNode,
  ICellNode,
} from '../../types/nodes.js';
import { Node } from './base.js';

export class CellNode extends Node implements ICellNode {
  readonly type = 'cell' as const;
  content: string;
  isHeader: boolean;
  colspan: number;
  rowspan: number;

  constructor(
    content: string,
    options: {
      isHeader?: boolean;
      colspan?: number;
      rowspan?: number;
      style?: Style;
    } = {}
  ) {
    super(options.style);
    this.content = content;
    this.isHeader = options.isHeader ?? false;
    this.colspan = options.colspan ?? 1;
    this.rowspan = options.rowspan ?? 1;
  }

  override text(): string {
    return this.content;
  }
}

export class RowNode extends Node implements IRowNode {
  readonly type = 'row' as const;
  cells: ICellNode[] = [];

  constructor(style?: Style) {
    super(style);
  }

  addCell(cell: CellNode): void {
    this.cells.push(cell);
    this.addChild(cell);
  }

  override text(): string {
    return this.cells.map((cell) => cell.text()).join('\t');
  }
}

export class TableNode extends Node implements ITableNode {
  readonly type = 'table' as const;
  rows: IRowNode[] = [];

  constructor(style?: Style) {
    super(style);
  }

  addRow(row: RowNode): void {
    this.rows.push(row);
    this.addChild(row);
  }

  /**
   * Format table as text.
   */
  override text(): string {
    if (this.rows.length === 0) return '';

    // Calculate column widths
    const colWidths: number[] = [];
    for (const row of this.rows) {
      row.cells.forEach((cell, i) => {
        const width = cell.text().length;
        colWidths[i] = Math.max(colWidths[i] || 0, width);
      });
    }

    // Format rows
    const lines: string[] = [];
    for (const row of this.rows) {
      const cells = row.cells.map((cell, i) => {
        const text = cell.text();
        return text.padEnd(colWidths[i] || 0);
      });
      lines.push(cells.join(' | '));
    }

    return lines.join('\n');
  }

  /**
   * Get number of columns.
   */
  get columnCount(): number {
    return Math.max(...this.rows.map((row) => row.cells.length), 0);
  }

  /**
   * Get number of rows.
   */
  get rowCount(): number {
    return this.rows.length;
  }
}

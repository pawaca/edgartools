/**
 * Node types for document tree structure.
 */

export type NodeType =
  | 'document'
  | 'section'
  | 'heading'
  | 'paragraph'
  | 'text'
  | 'table'
  | 'row'
  | 'cell'
  | 'list'
  | 'listItem'
  | 'link'
  | 'image'
  | 'container';

export type SemanticType =
  | 'item_header'
  | 'part_header'
  | 'toc'
  | 'signature'
  | 'exhibit'
  | 'footnote'
  | 'unknown';

export interface Style {
  fontWeight?: string;
  fontSize?: string;
  textAlign?: string;
  display?: string;
  textTransform?: string;
  fontStyle?: string;
  textDecoration?: string;
}

export interface NodeMetadata {
  [key: string]: unknown;
}

export interface INode {
  type: NodeType;
  children: INode[];
  style?: Style;
  metadata: NodeMetadata;
  semanticType?: SemanticType;

  addChild(node: INode): void;
  text(): string;
  find(predicate: (node: INode) => boolean): INode[];
  setMetadata(key: string, value: unknown): void;
  getMetadata(key: string): unknown;
}

export interface IHeadingNode extends INode {
  type: 'heading';
  content: string;
  level: number;
}

export interface ITextNode extends INode {
  type: 'text';
  content: string;
}

export interface IParagraphNode extends INode {
  type: 'paragraph';
}

export interface IContainerNode extends INode {
  type: 'container';
  tagName?: string;
}

export interface ITableNode extends INode {
  type: 'table';
  rows: IRowNode[];
}

export interface IRowNode extends INode {
  type: 'row';
  cells: ICellNode[];
}

export interface ICellNode extends INode {
  type: 'cell';
  content: string;
  isHeader: boolean;
  colspan: number;
  rowspan: number;
}

export interface ILinkNode extends INode {
  type: 'link';
  content: string;
  href: string;
  title?: string;
}

export interface IImageNode extends INode {
  type: 'image';
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface IListNode extends INode {
  type: 'list';
  ordered: boolean;
}

export interface IListItemNode extends INode {
  type: 'listItem';
}

export interface IDocumentNode extends INode {
  type: 'document';
}

export interface ISectionNode extends INode {
  type: 'section';
  name?: string;
}

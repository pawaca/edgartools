# TypeScript Migration Checklist

## Executive Summary

**Goal**: Migrate minimum viable 10-K parsing from Python to TypeScript

**Scope**: ~5,200 lines of core Python code across 7 modules

**Timeline Estimate**: 2-4 weeks for experienced TypeScript developer

**Complexity**: Medium (well-structured, clear boundaries)

---

## Quick Start

### 1. Dependencies to Install

```bash
npm install --save \
  axios \           # HTTP client (replaces httpx)
  cheerio \         # HTML parsing (replaces lxml)
  zod \             # Validation (replaces pydantic)
  string-similarity # Fuzzy matching

npm install --save-dev \
  @types/node \
  @types/cheerio
```

### 2. Module Migration Order

```
✓ Phase 1: SGML Parser (Week 1)
  ├── sgml_parser.ts
  ├── sgml_common.ts
  └── sgml_header.ts

✓ Phase 2: Node Tree (Week 1-2)
  ├── types.ts
  └── nodes.ts

✓ Phase 3: HTML Parser (Week 2)
  ├── parser.ts
  └── document_builder.ts

✓ Phase 4: Document Model (Week 2-3)
  ├── document.ts
  └── section_extractor.ts

✓ Phase 5: Integration (Week 3-4)
  ├── filing.ts
  ├── ten_k.ts
  └── index.ts (exports)
```

---

## Module-by-Module Breakdown

### Module 1: SGML Parser
**File**: `sgml/sgml_parser.py` → `sgml_parser.ts`
**Lines**: ~350
**Difficulty**: 🔴 Hard (custom parsing logic)

**Key Classes**:
```typescript
enum SGMLFormatType {
  SEC_DOCUMENT = 'sec_document',
  SUBMISSION = 'submission'
}

interface SGMLDocument {
  type: string
  sequence: string
  filename: string
  description: string
  rawContent: string

  text(): string
  html(): string | null
  xml(): string | null
  content(): string | Buffer
}

class SGMLParser {
  detectFormat(content: string): SGMLFormatType
  parse(content: string): ParsedSGML
}
```

**Critical Algorithms**:
- Line-by-line state machine
- Tag detection: `<TAG>value` vs `<TAG>...</TAG>`
- Path stack for nested sections
- UU-decoding for embedded files

**External Dependencies**: None (pure TS)

**Test Cases**:
- Parse SUBMISSION format filing
- Parse SEC_DOCUMENT format filing
- Extract HTML from primary document
- Handle UU-encoded content

---

### Module 2: SGML Common
**File**: `sgml/sgml_common.py` → `sgml_common.ts`
**Lines**: ~500
**Difficulty**: 🟡 Medium

**Key Classes**:
```typescript
class FilingSGML {
  header: FilingHeader
  documents: Map<string, SGMLDocument[]>

  html(): string | null
  xml(): string | null
  getContent(filename: string): string | null
  get attachments(): Attachment[]
}

class Attachment {
  sequenceNumber: string
  path: string
  document: string
  documentType: string
  description: string
  size: number | null

  download(): Promise<string>
}
```

**External Dependencies**: axios (for download)

---

### Module 3: SGML Header
**File**: `sgml/sgml_header.py` → `sgml_header.ts`
**Lines**: ~400
**Difficulty**: 🟢 Easy

**Key Classes**:
```typescript
interface FilingMetadata {
  [key: string]: any
  get(key: string): any
}

interface CompanyInformation {
  cik: string
  name: string
  irsNumber?: string
}

interface Address {
  street1?: string
  street2?: string
  city?: string
  stateOrCountry?: string
  zipCode?: string
}

class FilingHeader {
  metadata: FilingMetadata
  filers: Filer[]

  get accessionNumber(): string
  get filingDate(): string
  get form(): string
}
```

**External Dependencies**: None

---

### Module 4: Node Types
**File**: `documents/types.py` → `types.ts`
**Lines**: ~200
**Difficulty**: 🟢 Easy (mostly enums and interfaces)

**Key Types**:
```typescript
enum NodeType {
  DOCUMENT = 'DOCUMENT',
  SECTION = 'SECTION',
  HEADING = 'HEADING',
  PARAGRAPH = 'PARAGRAPH',
  TABLE = 'TABLE',
  LIST = 'LIST',
  LIST_ITEM = 'LIST_ITEM',
  LINK = 'LINK',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
  CONTAINER = 'CONTAINER'
}

enum SemanticType {
  TITLE = 'TITLE',
  HEADER = 'HEADER',
  BODY_TEXT = 'BODY_TEXT',
  FOOTNOTE = 'FOOTNOTE',
  TABLE_OF_CONTENTS = 'TABLE_OF_CONTENTS',
  FINANCIAL_STATEMENT = 'FINANCIAL_STATEMENT',
  ITEM_HEADER = 'ITEM_HEADER'
}

interface Style {
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  color?: string
  marginTop?: number
  marginBottom?: number

  isBold(): boolean
  isItalic(): boolean
  isCentered(): boolean
}

interface HeaderInfo {
  level: number
  confidence: number
  text: string
  detectionMethod: string
  isItem: boolean
  itemNumber?: string
}
```

**External Dependencies**: None

---

### Module 5: Node Hierarchy
**File**: `documents/nodes.py` → `nodes.ts`
**Lines**: ~800
**Difficulty**: 🟡 Medium (abstract classes, inheritance)

**Key Classes**:
```typescript
abstract class Node {
  id: string
  type: NodeType
  parent: Node | null
  children: Node[]
  content: any
  metadata: Record<string, any>
  style: Style

  abstract text(): string
  abstract html(): string

  addChild(child: Node): void
  removeChild(child: Node): void
  find(predicate: (node: Node) => boolean): Node[]
  walk(): Generator<Node>
}

class DocumentNode extends Node {
  type = NodeType.DOCUMENT

  text(): string
  html(): string
}

class SectionNode extends Node {
  type = NodeType.SECTION

  text(): string
  html(): string
}

class HeadingNode extends Node {
  type = NodeType.HEADING
  level: number

  text(): string
  html(): string
}

class ParagraphNode extends Node { }
class TextNode extends Node { }
class TableNode extends Node {
  rows: Row[]
}
class ListNode extends Node { }
class LinkNode extends Node { }
class ImageNode extends Node { }
```

**External Dependencies**: uuid (for node IDs)

---

### Module 6: HTML Parser
**File**: `documents/parser.py` → `parser.ts`
**Lines**: ~350
**Difficulty**: 🔴 Hard (orchestration, error handling)

**Key Classes**:
```typescript
interface ParserConfig {
  form?: string
  detectSections?: boolean
  tableExtraction?: boolean
  extractXbrl?: boolean
  preserveWhitespace?: boolean
  maxDocumentSize?: number
}

class HTMLParser {
  config: ParserConfig

  parse(html: string): Document

  private parseHtml(html: string): CheerioAPI
  private extractMetadata($: CheerioAPI, html: string): DocumentMetadata
  private buildDocument($: CheerioAPI, metadata: DocumentMetadata): Document
}
```

**External Dependencies**: cheerio

**Critical Methods**:
```typescript
parse(html: string): Document {
  // 1. Store original
  const originalHtml = html

  // 2. Preprocess
  html = this.preprocess(html)

  // 3. Parse with cheerio
  const $ = cheerio.load(html)

  // 4. Extract metadata
  const metadata = this.extractMetadata($, html)
  metadata.originalHtml = originalHtml

  // 5. Build document
  const document = this.buildDocument($, metadata)

  // 6. Postprocess
  return this.postprocess(document)
}
```

---

### Module 7: Document Builder
**File**: `documents/strategies/document_builder.py` → `document_builder.ts`
**Lines**: ~600
**Difficulty**: 🔴 Hard (recursive tree building)

**Key Classes**:
```typescript
class DocumentBuilder {
  static BLOCK_ELEMENTS = new Set([
    'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'section', 'article'
  ])

  static INLINE_ELEMENTS = new Set([
    'span', 'a', 'em', 'strong', 'b', 'i', 'u'
  ])

  static SKIP_ELEMENTS = new Set([
    'script', 'style', 'meta', 'link'
  ])

  build($: CheerioAPI): DocumentNode

  private processElement(
    element: Cheerio<Element>,
    parent: Node
  ): void
}
```

**Critical Algorithm**:
```typescript
private processElement(elem: Cheerio, parent: Node): void {
  const tagName = elem.prop('tagName')?.toLowerCase()

  // Skip?
  if (this.SKIP_ELEMENTS.has(tagName)) return

  // Create node
  let node: Node
  if (tagName.match(/^h[1-6]$/)) {
    node = new HeadingNode(parseInt(tagName[1]))
  } else if (tagName === 'p') {
    node = new ParagraphNode()
  } else if (tagName === 'table') {
    node = new TableNode()
  } // ... etc

  // Extract style
  node.style = this.parseStyle(elem)

  // Add to parent
  parent.addChild(node)

  // Process children
  elem.children().each((_, child) => {
    this.processElement($(child), node)
  })
}
```

**External Dependencies**: cheerio

---

### Module 8: Document Model
**File**: `documents/document.py` → `document.ts`
**Lines**: ~600
**Difficulty**: 🟡 Medium

**Key Classes**:
```typescript
interface DocumentMetadata {
  source?: string
  form?: string
  company?: string
  cik?: string
  accessionNumber?: string
  filingDate?: string
  reportDate?: string
  url?: string
  size: number
  parseTime: number
  parserVersion: string
  originalHtml?: string
}

interface Section {
  name: string
  title: string
  node: SectionNode
  startOffset: number
  endOffset: number
  confidence: number
  detectionMethod: 'toc' | 'heading' | 'pattern'
  part?: string
  item?: string

  text(): string
  html(): string
  tables(): Table[]
}

class Document {
  root: DocumentNode
  metadata: DocumentMetadata
  sections: Map<string, Section>

  text(): string
  html(): string
  findTables(): Table[]
}
```

**External Dependencies**: None

---

### Module 9: Section Extractor
**File**: `documents/extractors/pattern_section_extractor.py` → `section_extractor.ts`
**Lines**: ~400
**Difficulty**: 🟡 Medium

**Key Classes**:
```typescript
class SectionExtractor {
  static SECTION_PATTERNS: Record<string, Record<string, RegExp[]>> = {
    '10-K': {
      'business': [
        /^(Item|ITEM)\s+1\.?\s*Business/i,
        /^Business\s*$/i
      ],
      'risk_factors': [
        /^(Item|ITEM)\s+1A\.?\s*Risk\s+Factors/i,
        /^Risk\s+Factors/i
      ],
      'mda': [
        /^(Item|ITEM)\s+7\.?\s*Management.*Discussion/i,
        /^Management.*Discussion.*Analysis/i
      ],
      'financial_statements': [
        /^(Item|ITEM)\s+8\.?\s*Financial\s+Statements/i
      ]
    }
  }

  extractSections(document: Document): Map<string, Section>

  private matchPatterns(text: string, form: string): string | null
  private findBoundaries(
    startNode: Node,
    sections: Map<string, Node>
  ): void
}
```

**Algorithm**:
```typescript
extractSections(document: Document): Map<string, Section> {
  const sections = new Map<string, Section>()
  const form = document.metadata.form || '10-K'

  // Traverse tree, find headings
  for (const node of document.root.walk()) {
    if (node instanceof HeadingNode) {
      const text = node.text().trim()
      const sectionName = this.matchPatterns(text, form)

      if (sectionName) {
        sections.set(sectionName, {
          name: sectionName,
          title: text,
          node: this.extractContent(node),
          detectionMethod: 'pattern'
        })
      }
    }
  }

  return sections
}
```

**External Dependencies**: None

---

### Module 10: Filing Class
**File**: `_filings.py` → `filing.ts`
**Lines**: ~300 (partial)
**Difficulty**: 🟡 Medium

**Key Classes**:
```typescript
class Filing {
  cik: number
  company: string
  form: string
  filingDate: string
  accessionNo: string

  private _sgml?: FilingSGML

  async sgml(): Promise<FilingSGML>
  async html(): Promise<string | null>
  async obj(): Promise<TenK>

  get homepageUrl(): string
  get textUrl(): string
  get baseDir(): string
}
```

**Implementation**:
```typescript
async sgml(): Promise<FilingSGML> {
  if (!this._sgml) {
    // Download filing text
    const url = this.textUrl
    const response = await axios.get(url)
    const content = response.data

    // Parse SGML
    const parser = new SGMLParser()
    const parsed = parser.parse(content)

    this._sgml = new FilingSGML(parsed.header, parsed.documents)
  }
  return this._sgml
}

async html(): Promise<string | null> {
  const sgml = await this.sgml()
  return sgml.html()
}

async obj(): Promise<TenK> {
  return new TenK(this)
}
```

**External Dependencies**: axios

---

### Module 11: TenK Class
**File**: `company_reports/ten_k.py` → `ten_k.ts`
**Lines**: ~400
**Difficulty**: 🟢 Easy (mostly wiring)

**Key Classes**:
```typescript
class TenK {
  private filing: Filing
  private _document?: Document

  async document(): Promise<Document>
  async sections(): Promise<Map<string, Section>>
  async items(): Promise<string[]>

  // Convenience methods
  async business(): Promise<string>
  async riskFactors(): Promise<string>
  async mda(): Promise<string>
}
```

**Implementation**:
```typescript
async document(): Promise<Document> {
  if (!this._document) {
    const html = await this.filing.html()
    if (!html) throw new Error('No HTML available')

    const config: ParserConfig = { form: '10-K' }
    const parser = new HTMLParser(config)
    this._document = parser.parse(html)
  }
  return this._document
}

async sections(): Promise<Map<string, Section>> {
  const doc = await this.document()
  return doc.sections
}

async business(): Promise<string> {
  const sections = await this.sections()
  const section = sections.get('business')
  return section ? section.text() : ''
}
```

**External Dependencies**: None

---

## Testing Strategy

### Unit Tests

**SGML Parser**:
```typescript
describe('SGMLParser', () => {
  it('should detect SUBMISSION format')
  it('should detect SEC_DOCUMENT format')
  it('should parse header metadata')
  it('should parse documents list')
  it('should extract HTML content')
  it('should handle UU-encoded content')
})
```

**HTML Parser**:
```typescript
describe('HTMLParser', () => {
  it('should parse valid HTML')
  it('should handle malformed HTML')
  it('should extract metadata')
  it('should build node tree')
  it('should preserve structure')
})
```

**Section Extractor**:
```typescript
describe('SectionExtractor', () => {
  it('should detect Item 1 (Business)')
  it('should detect Item 1A (Risk Factors)')
  it('should detect Item 7 (MD&A)')
  it('should detect Item 8 (Financial Statements)')
  it('should handle missing sections')
  it('should determine correct boundaries')
})
```

### Integration Tests

```typescript
describe('10-K Parsing End-to-End', () => {
  it('should parse Apple 10-K (2023)', async () => {
    const filing = new Filing({
      cik: 320193,
      company: 'Apple Inc.',
      form: '10-K',
      filingDate: '2023-11-03',
      accessionNo: '0000320193-23-000077'
    })

    const tenK = await filing.obj()
    const sections = await tenK.sections()

    expect(sections.has('business')).toBe(true)
    expect(sections.has('risk_factors')).toBe(true)
    expect(sections.has('mda')).toBe(true)

    const business = await tenK.business()
    expect(business).toContain('Apple Inc.')
  })
})
```

### Test Data

Use real filings from SEC:
- Apple 10-K: 0000320193-23-000077
- Microsoft 10-K: 0001564590-23-000018
- Tesla 10-K: 0001628280-23-000015

---

## Common Pitfalls & Solutions

### 1. SGML Unclosed Tags
**Problem**: SGML uses unclosed tags
```
<CIK>0000789019
<COMPANY>MICROSOFT CORP
```

**Solution**: Don't expect closing tags
```typescript
const match = line.match(/^<([A-Z-]+)>(.*)$/)
if (match) {
  const [_, tag, value] = match
  // Store immediately, don't wait for close
}
```

### 2. HTML Malformation
**Problem**: SEC HTML is often invalid
```html
<p>Text
<div>More text
```

**Solution**: Use recovery mode in cheerio
```typescript
const $ = cheerio.load(html, {
  xmlMode: false,  // HTML mode (lenient)
  decodeEntities: true
})
```

### 3. XML Declarations
**Problem**: Some files start with XML declaration
```html
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
```

**Solution**: Strip before parsing
```typescript
html = html.replace(/^<\?xml[^>]*\?>/, '')
html = html.replace(/^<!DOCTYPE[^>]*>/, '')
```

### 4. Character Encoding
**Problem**: Mix of encodings in filings

**Solution**: Force UTF-8 decoding
```typescript
const response = await axios.get(url, {
  responseType: 'arraybuffer'
})
const html = new TextDecoder('utf-8').decode(response.data)
```

### 5. Section Boundary Detection
**Problem**: Hard to know where sections end

**Solution**: Use next section start as end
```typescript
function findBoundaries(sections: Node[]): SectionBoundary[] {
  return sections.map((section, i) => ({
    start: section,
    end: sections[i + 1] || null  // null = end of doc
  }))
}
```

---

## Performance Considerations

### 1. Lazy Loading
Don't parse until needed:
```typescript
class TenK {
  private _document?: Document

  async document(): Promise<Document> {
    if (!this._document) {
      // Parse only when accessed
      this._document = await this.parseDocument()
    }
    return this._document
  }
}
```

### 2. Caching
Cache parsed results:
```typescript
class Filing {
  private _sgml?: FilingSGML
  private _html?: string

  async sgml(): Promise<FilingSGML> {
    if (!this._sgml) {
      this._sgml = await this.parseSGML()
    }
    return this._sgml
  }
}
```

### 3. Streaming
For large documents, consider streaming:
```typescript
import { parse } from 'htmlparser2'

const parser = parse({
  onopentag(name, attributes) {
    // Process incrementally
  }
})
```

### 4. Parallel Processing
Parse multiple sections in parallel:
```typescript
const sections = await Promise.all([
  extractor.extract('business'),
  extractor.extract('risk_factors'),
  extractor.extract('mda')
])
```

---

## Project Structure

```
src/
├── index.ts                    # Main exports
│
├── sgml/
│   ├── sgml_parser.ts
│   ├── sgml_common.ts
│   ├── sgml_header.ts
│   └── index.ts
│
├── documents/
│   ├── parser.ts
│   ├── document.ts
│   ├── nodes.ts
│   ├── types.ts
│   ├── config.ts
│   │
│   ├── strategies/
│   │   ├── document_builder.ts
│   │   └── index.ts
│   │
│   ├── extractors/
│   │   ├── section_extractor.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
├── company_reports/
│   ├── ten_k.ts
│   └── index.ts
│
├── filing.ts
└── utils/
    ├── http.ts
    └── encoding.ts

test/
├── sgml/
│   └── sgml_parser.test.ts
├── documents/
│   ├── parser.test.ts
│   └── section_extractor.test.ts
├── integration/
│   └── ten_k.test.ts
└── fixtures/
    ├── apple-10k.txt
    └── microsoft-10k.txt
```

---

## Migration Checklist

### Week 1
- [ ] Set up TypeScript project
- [ ] Install dependencies (axios, cheerio, zod)
- [ ] Implement `sgml_parser.ts`
- [ ] Implement `sgml_common.ts`
- [ ] Implement `sgml_header.ts`
- [ ] Write SGML parser tests
- [ ] Test with real filing

### Week 2
- [ ] Implement `types.ts` (enums, interfaces)
- [ ] Implement `nodes.ts` (Node hierarchy)
- [ ] Implement `parser.ts` (HTMLParser)
- [ ] Implement `document_builder.ts`
- [ ] Write HTML parser tests
- [ ] Test tree building

### Week 3
- [ ] Implement `document.ts` (Document class)
- [ ] Implement `section_extractor.ts`
- [ ] Write section extraction tests
- [ ] Test with multiple 10-K filings

### Week 4
- [ ] Implement `filing.ts` (Filing class)
- [ ] Implement `ten_k.ts` (TenK class)
- [ ] Write integration tests
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation

---

## Success Criteria

### Functional
✓ Parse Apple 10-K correctly
✓ Parse Microsoft 10-K correctly
✓ Parse Tesla 10-K correctly
✓ Extract all major sections (Items 1, 1A, 7, 8)
✓ Handle malformed HTML gracefully
✓ Handle various SGML formats

### Performance
✓ Parse 10-K in < 5 seconds
✓ Extract sections in < 1 second
✓ Memory usage < 100MB per filing

### Code Quality
✓ TypeScript strict mode
✓ 80%+ test coverage
✓ All tests passing
✓ No console errors
✓ Clean linting

---

## Resources

### Documentation
- SEC EDGAR: https://www.sec.gov/edgar
- SGML Spec: https://www.w3.org/TR/REC-html32.html
- 10-K Structure: https://www.sec.gov/forms

### Libraries
- cheerio: https://cheerio.js.org/
- axios: https://axios-http.com/
- zod: https://zod.dev/

### Example Filings
- Apple: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000320193&type=10-K
- Microsoft: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000789019&type=10-K

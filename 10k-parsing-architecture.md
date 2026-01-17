# EdgarTools 10-K Parsing Architecture Analysis

## Analysis: 10-K Filing Parsing Flow

### Overview
EdgarTools parses 10-K annual reports through a multi-stage pipeline that converts SEC EDGAR SGML filings into structured document objects with extracted sections. The pipeline involves SGML parsing, HTML extraction, document parsing, and section detection.

---

## 1. Core Parsing Flow

### High-Level Pipeline
```
Filing → sgml() → FilingSGML → html() → HTMLParser → Document → TenK.sections
   ↓         ↓                      ↓         ↓            ↓            ↓
 Entry   SGML Parse          HTML Extract  Parse HTML  Build Tree  Extract Sections
```

### Entry Points

#### edgar/__init__.py:212-235
- **Function**: `obj(sec_filing: Filing) -> TenK`
- **Purpose**: Factory function that dispatches to form-specific parsers
- **Flow**: Matches form type and instantiates appropriate report class

```python
def obj(sec_filing: Filing):
    if matches_form(sec_filing, "10-K"):
        return TenK(sec_filing)
```

#### edgar/_filings.py:1371-1570
- **Class**: `Filing`
- **Key Properties**:
  - `cik`, `company`, `form`, `filing_date`, `accession_no`
  - `_filing_homepage`: FilingHomepage instance
  - `_sgml`: Cached FilingSGML instance

**Filing.sgml() Flow** (line 1737):
1. Downloads SGML text from SEC EDGAR archive
2. Parses using `SGMLParser`
3. Returns `FilingSGML` instance with header and documents

**Filing.html() Flow** (line 1537):
1. Calls `self.sgml()`
2. Extracts primary HTML document from attachments
3. Returns HTML string content

**Filing.obj() Flow** (line 1864):
1. Calls global `obj()` function
2. Returns form-specific object (TenK for 10-K filings)

---

## 2. SGML Parsing Module

### edgar/sgml/sgml_parser.py

**Total SGML Module Lines**: ~3,228 lines across all files

#### SGMLParser (line 149)
- **Purpose**: Main SGML parsing orchestrator
- **Key Method**: `parse(content: str) -> dict`

**Format Detection** (line 151):
```python
def detect_format(content: str) -> SGMLFormatType:
    if content.startswith('<SUBMISSION>'):
        return SGMLFormatType.SUBMISSION
    elif '<SEC-DOCUMENT>' in content:
        return SGMLFormatType.SEC_DOCUMENT
```

**Parse Dispatch** (line 180):
```python
def parse(self, content) -> dict:
    format_type = self.detect_format(content)
    if format_type == SGMLFormatType.SUBMISSION:
        return self._parse_submission_format(content)
    else:
        return self._parse_sec_document_format(content)
```

#### SGMLDocument (line 33)
- **Dataclass Fields**: `type`, `sequence`, `filename`, `description`, `raw_content`
- **Key Methods**:
  - `text()`: Extracts content between `<TEXT>` tags
  - `html()`: Extracts content between `<HTML>` tags
  - `xml()`: Extracts content between `<XML>` tags
  - `content`: Property that decodes UU-encoded data if present

#### SubmissionFormatParser (line 198)
**Parser State** (line 199-245):
- `current_path`: Stack tracking position in hierarchy
- `header_lines`: Collects header content
- `SECTION_TAGS`: Set of known nested tags (FILER, OWNER-DATA, etc.)
- `REPEATABLE_TAGS`: Tags that can appear multiple times

**Parsing Logic**:
1. Line-by-line scanning of SGML content
2. Tag detection using regex patterns
3. Hierarchical structure building
4. Context management using path stack

### edgar/sgml/sgml_common.py

#### FilingSGML (line 222)
- **Purpose**: Container for parsed SGML filing with header and documents
- **Slots**: `header`, `_documents_by_sequence` (memory efficiency)

**html() Method** (line 289):
```python
def html(self):
    html_document = self.attachments.primary_html_document
    if html_document and not html_document.is_binary():
        html_text = self.get_content(html_document.document)
        return html_text
```

**Key Properties**:
- `attachments`: Returns `Attachments` collection of all documents
- `header`: `FilingHeader` with metadata
- `filing_summary`: Optional FilingSummary.xml parsing

### edgar/sgml/sgml_header.py

#### FilingHeader
- **Purpose**: Parse and represent SEC filing header metadata
- **Components**:
  - `FilingMetadata`: Key-value pairs from header
  - `Filer`: Company information
  - `CompanyInformation`: CIK, name, IRS number
  - Addresses (mailing, business)

**Preprocessing** (line 43):
```python
def preprocess_old_headers(text: str) -> str:
    # Converts tag-based format to tab-indented format
    # Removes XML tags and normalizes structure
```

---

## 3. HTML Parsing Module

### edgar/documents/parser.py

#### HTMLParser (line 23)
- **Purpose**: Main HTML parser orchestrating the parsing pipeline
- **Components**:
  - `config`: ParserConfig instance
  - `preprocessor`: HTMLPreprocessor
  - `postprocessor`: DocumentPostprocessor
  - `strategies`: Dict of parsing strategies (header detection, table processing, XBRL extraction)

**parse() Method Flow** (line 79):
```python
def parse(self, html: str) -> Document:
    # 1. Store original HTML for TOC analysis
    original_html = html

    # 2. Extract XBRL data BEFORE preprocessing
    xbrl_facts = self._extract_xbrl_pre_process(html)

    # 3. Preprocess HTML (normalize, clean)
    html = self.preprocessor.process(html)

    # 4. Parse with lxml
    tree = self._parse_html(html)

    # 5. Extract metadata
    metadata = self._extract_metadata(tree, html)
    metadata.original_html = original_html

    # 6. Build document tree
    document = self._build_document(tree, metadata)

    # 7. Postprocess
    document = self.postprocessor.process(document)

    return document
```

**_parse_html()** (line 177):
- Uses lxml.html parser with recovery mode
- Removes XML declarations
- Ensures proper document structure

**Strategy Initialization** (line 60):
```python
def _init_strategies(self):
    if self.config.detect_sections:
        from edgar.documents.strategies.header_detection import HeaderDetectionStrategy
        self.strategies['header_detection'] = HeaderDetectionStrategy(self.config)

    if self.config.table_extraction:
        from edgar.documents.strategies.table_processing import TableProcessor
        self.strategies['table_processing'] = TableProcessor(self.config)

    if self.config.extract_xbrl:
        from edgar.documents.strategies.xbrl_extraction import XBRLExtractor
        self.strategies['xbrl_extraction'] = XBRLExtractor()
```

### edgar/documents/strategies/document_builder.py

#### DocumentBuilder (line 27)
- **Purpose**: Converts lxml HTML tree into structured node tree
- **Element Classification**:
  - `BLOCK_ELEMENTS`: div, p, h1-h6, ul, ol, table, etc.
  - `INLINE_ELEMENTS`: span, a, em, strong, font, ix:nonfraction
  - `SKIP_ELEMENTS`: script, style, meta, ix:exclude

**build() Method** (line 77):
```python
def build(self, tree: HtmlElement) -> DocumentNode:
    # 1. Create root document node
    root = DocumentNode()

    # 2. Find body element
    body = tree.find('.//body') or tree

    # 3. Process body content recursively
    self._process_element(body, root)

    # 4. Apply node merging if configured
    # 5. Return document
```

**Element Processing**:
- Recursive tree traversal
- Style extraction and parsing
- Node type determination
- Hierarchy maintenance

---

## 4. Document Structure

### edgar/documents/document.py

#### Document (line 66-350)
**Core Components**:
- `root`: DocumentNode (root of node tree)
- `metadata`: DocumentMetadata
- `sections`: Dictionary of Section objects

#### DocumentMetadata (line 26)
**Fields**:
- `source`, `form`, `company`, `cik`, `accession_number`
- `filing_date`, `report_date`, `url`
- `size`, `parse_time`, `parser_version`
- `xbrl_data`: List of XBRLFact
- `preserve_whitespace`: bool
- `original_html`: str (for TOC analysis)

#### Section (line 66)
**Attributes**:
- `name`: Section identifier (e.g., "item_1", "risk_factors")
- `title`: Display title (e.g., "Item 1 - Business")
- `node`: SectionNode containing content
- `start_offset`, `end_offset`: Character positions
- `confidence`: Detection confidence (0.0-1.0)
- `detection_method`: 'toc', 'heading', or 'pattern'
- `validated`: Cross-validation flag
- `part`: Optional part identifier for 10-Q ("I", "II")
- `item`: Optional item identifier ("1", "1A", etc.)

**Key Methods**:
- `text()`: Extract plain text content
- `html()`: Generate HTML representation
- `tables()`: Extract tables from section

### edgar/documents/nodes.py

#### Node Hierarchy (line 14)
**Base Node Class** (ABC):
- **Identity**: `id` (UUID), `type` (NodeType enum)
- **Hierarchy**: `parent`, `children`
- **Content**: `content`, `metadata`, `style`
- **Semantic**: `semantic_type`, `semantic_role`

**Abstract Methods**:
- `text() -> str`: Extract text content
- `html() -> str`: Generate HTML

**Node Types**:
- `DocumentNode` (line 142): Root document
- `SectionNode` (line 190): Document section
- `HeadingNode` (line 227): Headers (h1-h6)
- `ParagraphNode` (line 280): Paragraphs
- `TextNode` (line 317): Text content
- `TableNode`: Tables (in table_nodes.py)
- `ListNode`, `ListItemNode`: Lists
- `LinkNode`, `ImageNode`: Links and images
- `ContainerNode`: Generic containers

### edgar/documents/types.py

#### Key Enums and Types

**NodeType** (line 10):
- DOCUMENT, SECTION, HEADING, PARAGRAPH, TABLE, LIST, LIST_ITEM, LINK, IMAGE, XBRL_FACT, TEXT, CONTAINER

**SemanticType** (line 26):
- TITLE, HEADER, BODY_TEXT, FOOTNOTE, TABLE_OF_CONTENTS, FINANCIAL_STATEMENT, DISCLOSURE, ITEM_HEADER, SECTION_HEADER, SIGNATURE, EXHIBIT

**Style** (line 52):
- Dataclass with CSS properties (font_size, font_weight, text_align, margins, etc.)
- Helper properties: `is_bold`, `is_italic`, `is_centered`

**HeaderInfo** (line 117):
- `level`: Header level 1-6
- `confidence`: Detection confidence
- `text`: Header text
- `detection_method`: Detection strategy used
- `is_item`: Whether it's an item header
- `item_number`: Extracted item number

---

## 5. Section Detection

### edgar/documents/extractors/pattern_section_extractor.py

#### SectionExtractor (line 15)
**Purpose**: Extract logical sections using pattern matching

**SECTION_PATTERNS** (line 27):
Regex patterns for each filing type and section:
- **10-K Patterns**:
  - `business`: `r'^(Item|ITEM)\s+1\.?\s*Business'`
  - `risk_factors`: `r'^(Item|ITEM)\s+1A\.?\s*Risk\s+Factors'`
  - `mda`: `r'^(Item|ITEM)\s+7\.?\s*Management.*Discussion'`
  - `financial_statements`: `r'^(Item|ITEM)\s+8\.?\s*Financial\s+Statements'`

**Detection Strategy**:
1. Traverse document node tree
2. Match heading text against patterns
3. Determine section boundaries
4. Extract content between boundaries

### edgar/documents/extractors/toc_section_extractor.py

#### SECSectionExtractor (line 34)
**Purpose**: Extract sections using Table of Contents analysis

**Flow**:
1. `_analyze_sections()` (line 49):
   - Parse original HTML with lxml
   - Use TOCAnalyzer to find TOC structure
   - Map section names to anchor IDs
   - Verify anchor targets exist

2. Section Boundary Detection:
   - Find elements by anchor ID
   - Determine start and end positions
   - Calculate text offsets
   - Set confidence scores (TOC = 0.95)

**TOCAnalyzer** (edgar/documents/utils/toc_analyzer.py):
- Identifies Table of Contents in HTML
- Extracts section-to-anchor mappings
- Handles various TOC formats

### edgar/documents/strategies/header_detection.py

#### Header Detection Strategies

**StyleBasedDetector** (line 29):
- Font size ratio analysis
- Font weight detection (bold)
- Text alignment (centered)
- Uppercase text detection
- Margin analysis
- Confidence threshold: 0.4

**PatternBasedDetector** (line 99):
- Regex pattern matching
- Item number extraction
- Part boundary detection

---

## 6. TenK Report Class

### edgar/company_reports/ten_k.py

#### TenK (line 48)
**Inheritance**: Extends `CompanyReport`

**Structure** (line 49):
```python
structure = FilingStructure({
    "PART I": {
        "ITEM 1": {"Title": "Business", ...},
        "ITEM 1A": {"Title": "Risk Factors", ...},
        ...
    },
    "PART II": {
        "ITEM 5": {"Title": "Market for Registrant's Common Equity", ...},
        ...
    },
    ...
})
```

**document Property** (line 167):
```python
@cached_property
def document(self):
    html = self._filing.html()
    if not html:
        return None
    config = ParserConfig(form='10-K')
    parser = HTMLParser(config)
    return parser.parse(html)
```

**sections Property** (line 201):
```python
@property
def sections(self):
    if self.document:
        return self.document.sections
    return {}
```

**items Property** (line 221):
Maps friendly section names to Item numbers:
```python
section_to_item = {
    'business': 'Item 1',
    'risk_factors': 'Item 1A',
    'mda': 'Item 7',
    ...
}
```

**Convenience Properties**:
- `business`: Returns Item 1 content
- `risk_factors`: Returns Item 1A content
- `management_discussion`: Returns Item 7 content

---

## 7. External Dependencies

### Core Dependencies (from pyproject.toml)

#### HTTP and Networking
- **httpx >= 0.25.0**: Modern HTTP client with async support
  - Used for downloading filings from SEC EDGAR
  - Features: connection pooling, HTTP/2, retries
- **httpxthrottlecache >= 0.1.6**: HTTP caching and throttling
- **stamina >= 24.2.0**: Retry logic and resilience
- **hishel == 0.1.3**: HTTP caching library

#### Data Processing
- **pandas >= 2.0.0**: DataFrame operations for filing indexes
- **pyarrow >= 17.0.0**: Efficient columnar data format
  - Filing indexes stored as PyArrow tables
  - Fast filtering and querying
- **numpy**: Array operations (dependency of pandas)

#### HTML/XML Parsing
- **lxml >= 4.4**: C-based XML/HTML parser
  - Main HTML parsing engine
  - XPath support
  - High performance
- **beautifulsoup4 >= 4.10.0**: HTML parsing and manipulation
  - Legacy support for some operations

#### Text Processing
- **textdistance >= 4.5.0**: String similarity algorithms
- **rapidfuzz >= 3.5.0**: Fast string matching
- **unidecode >= 1.2.0**: Unicode transliteration
- **rank_bm25 >= 0.2.1**: BM25 search ranking algorithm

#### Output and Display
- **rich >= 13.8.0**: Terminal formatting and progress
  - Tables, panels, syntax highlighting
  - Progress bars
- **tabulate >= 0.9.0**: Table formatting
- **humanize >= 4.0.0**: Human-readable numbers and dates

#### Serialization
- **orjson >= 3.6.0**: Fast JSON serialization
- **pydantic >= 2.0.0**: Data validation and settings

#### Other
- **jinja2 >= 3.1.0**: Template engine
- **tqdm >= 4.62.0**: Progress bars
- **nest-asyncio >= 1.5.1**: Nested async event loops

---

## 8. Key TypeScript Equivalents Needed

### HTTP Client
- **httpx** → `axios` or `node-fetch`
- Needs: connection pooling, retry logic, caching

### HTML/XML Parsing
- **lxml** → `cheerio` (jQuery-like) or `jsdom` (DOM implementation)
- Alternative: `htmlparser2` (fast, streaming)
- XPath support: `xpath` package or built-in DOM XPath

### Data Structures
- **PyArrow tables** → Custom columnar storage or in-memory database
  - Alternative: `duckdb-wasm` for SQL on columnar data
  - Or: Plain arrays with efficient filtering

- **Pandas DataFrames** → `danfojs` or custom implementation
  - For TypeScript: May not need full DataFrame; arrays + functions sufficient

### String Processing
- **rapidfuzz** → `fuse.js` (fuzzy search) or `fast-fuzzy`
- **textdistance** → `string-similarity` or custom Levenshtein
- **rank_bm25** → `natural` library or custom BM25 implementation

### Terminal Display
- **rich** → `chalk` + `cli-table3` + `ora`
  - Tables: `cli-table3`
  - Colors: `chalk`
  - Progress: `ora` or `cli-progress`

### Validation
- **pydantic** → `zod` or `io-ts`
  - Runtime type validation
  - Schema definition

---

## 9. Minimum Viable Set for 10-K Parsing

### Essential Modules

#### 1. SGML Parser (Required)
**Files**:
- `sgml/sgml_parser.py` (~350 lines)
- `sgml/sgml_common.py` (~500 lines)
- `sgml/sgml_header.py` (~400 lines)

**Purpose**: Extract HTML from SGML filing wrapper

**TypeScript Implementation**:
```typescript
class SGMLParser {
  detectFormat(content: string): SGMLFormatType
  parse(content: string): ParsedSGML
}

interface ParsedSGML {
  header: FilingHeader
  documents: SGMLDocument[]
}

class FilingSGML {
  header: FilingHeader
  documents: Map<string, SGMLDocument>

  html(): string | null
  get attachments(): Attachment[]
}
```

#### 2. HTML Parser (Required)
**Files**:
- `documents/parser.py` (~350 lines)
- `documents/strategies/document_builder.py` (~600 lines)

**Purpose**: Parse HTML into node tree

**TypeScript Implementation**:
```typescript
class HTMLParser {
  config: ParserConfig

  parse(html: string): Document
}

class DocumentBuilder {
  build(tree: HTMLElement): DocumentNode
}
```

**External Dependency**: lxml → cheerio/jsdom

#### 3. Node Tree (Required)
**Files**:
- `documents/nodes.py` (~800 lines)
- `documents/types.py` (~200 lines)

**Purpose**: Represent parsed document structure

**TypeScript Implementation**:
```typescript
enum NodeType {
  DOCUMENT, SECTION, HEADING, PARAGRAPH, TABLE, TEXT, ...
}

abstract class Node {
  id: string
  type: NodeType
  parent: Node | null
  children: Node[]
  metadata: Record<string, any>
  style: Style

  abstract text(): string
  abstract html(): string
  find(predicate: (node: Node) => boolean): Node[]
}

class DocumentNode extends Node { }
class SectionNode extends Node { }
class HeadingNode extends Node { }
class ParagraphNode extends Node { }
class TextNode extends Node { }
```

#### 4. Section Extraction (Required)
**Files**:
- `documents/extractors/pattern_section_extractor.py` (~400 lines)
- `documents/extractors/toc_section_extractor.py` (~300 lines)

**Purpose**: Identify and extract 10-K sections

**TypeScript Implementation**:
```typescript
class SectionExtractor {
  SECTION_PATTERNS: Record<string, RegExp[]>

  extractSections(document: Document): Map<string, Section>
}

interface Section {
  name: string
  title: string
  node: SectionNode
  startOffset: number
  endOffset: number
  confidence: number
  detectionMethod: 'toc' | 'heading' | 'pattern'
  item?: string
}
```

#### 5. Document Model (Required)
**Files**:
- `documents/document.py` (~600 lines)

**Purpose**: Main document representation with sections

**TypeScript Implementation**:
```typescript
class Document {
  root: DocumentNode
  metadata: DocumentMetadata
  sections: Map<string, Section>

  text(): string
  html(): string
  findTables(): Table[]
}

interface DocumentMetadata {
  form?: string
  company?: string
  cik?: string
  accessionNumber?: string
  filingDate?: string
  parseTime: number
  parserVersion: string
}
```

#### 6. Filing Entry Point (Required)
**Files**:
- `_filings.py` (partial - Filing class only, ~300 lines)

**Purpose**: Entry point for filing access

**TypeScript Implementation**:
```typescript
class Filing {
  cik: number
  company: string
  form: string
  filingDate: string
  accessionNo: string

  sgml(): FilingSGML
  html(): string | null
  obj(): TenK
}
```

#### 7. TenK Report (Required)
**Files**:
- `company_reports/ten_k.py` (~400 lines)

**Purpose**: 10-K specific functionality

**TypeScript Implementation**:
```typescript
class TenK {
  filing: Filing

  get document(): Document
  get sections(): Map<string, Section>
  get items(): string[]

  get business(): string
  get riskFactors(): string
  get mda(): string
}
```

---

## 10. Optional Modules (Not Required for MVP)

### Can Skip for Initial Migration
- **XBRL parsing** (`xbrl/` directory): Financial data extraction
- **Table extraction** (`documents/table_nodes.py`): Advanced table parsing
- **Search functionality** (`search.py`): BM25 and regex search
- **Filing indexes** (PyArrow table management): Can use simple arrays
- **Rich display** (terminal formatting): Can use simple console.log
- **Caching** (`cache_mixin.py`): Can add later for performance
- **Homepage parsing** (`attachments.py`): Not needed for basic parsing
- **Company entities** (`entity/`): Not needed for single filing parsing

### Total Code Volume Estimate

**Essential Code**:
- SGML parsing: ~1,250 lines
- HTML parsing: ~950 lines
- Node tree: ~1,000 lines
- Section extraction: ~700 lines
- Document model: ~600 lines
- Filing class: ~300 lines
- TenK class: ~400 lines

**Total MVP**: ~5,200 lines of Python to migrate to TypeScript

**Note**: This excludes:
- Tests
- Comments
- Blank lines
- Optional features
- External dependencies (implement via npm packages)

---

## 11. Data Flow Summary

### Complete 10-K Parsing Flow

```
1. Filing.sgml()
   └─> Downloads filing text from SEC
   └─> SGMLParser.parse(content)
       └─> Detects format (SUBMISSION vs SEC_DOCUMENT)
       └─> Parses header → FilingHeader
       └─> Parses documents → List[SGMLDocument]
       └─> Returns FilingSGML(header, documents)

2. FilingSGML.html()
   └─> Gets primary_html_document from attachments
   └─> Extracts HTML from SGMLDocument.content
   └─> Returns HTML string

3. TenK.document property
   └─> Calls self._filing.html()
   └─> Creates ParserConfig(form='10-K')
   └─> HTMLParser(config).parse(html)
       └─> Preprocessor: Clean HTML
       └─> lxml.html.fromstring(): Parse to tree
       └─> DocumentBuilder.build(tree)
           └─> Recursively process elements
           └─> Create node hierarchy
           └─> Extract styles
           └─> Build DocumentNode tree
       └─> Postprocessor: Merge nodes, cleanup
       └─> Returns Document(root, metadata)

4. Document.sections (lazy property)
   └─> PatternSectionExtractor.extract(document)
       └─> Traverse node tree
       └─> Match headings against patterns
       └─> Identify Item boundaries
       └─> Extract content between items
       └─> Return Map<string, Section>
   └─> OR TOCSectionExtractor.extract(document)
       └─> Parse original HTML
       └─> Find Table of Contents
       └─> Map TOC links to anchors
       └─> Extract content by anchor ranges
       └─> Return Map<string, Section>

5. TenK.sections property
   └─> Returns self.document.sections
   └─> Maps to friendly names (business, risk_factors, etc.)
```

---

## 12. Critical Implementation Details

### SGML Parsing Gotchas
1. **UU-encoding**: Some documents use UU-encoding (line 56-70 in sgml_parser.py)
   - Must decode using UU decoder
   - TypeScript needs `uudecode` equivalent

2. **Multiple formats**: Two SGML formats (SUBMISSION, SEC_DOCUMENT)
   - Must detect and handle both

3. **Unclosed tags**: SGML uses unclosed tags with values
   - Example: `<CIK>0000789019`
   - Not valid XML; custom parsing required

### HTML Parsing Gotchas
1. **XML declarations**: Some filings have XML declarations
   - Must strip before parsing: `html.replace(/^<\?xml[^>]*\?>/, '')`

2. **Malformed HTML**: SEC filings often have invalid HTML
   - Parser must be in recovery/lenient mode
   - lxml uses `recover=True`

3. **Character encoding**: Mix of UTF-8 and other encodings
   - Must handle encoding detection and conversion

4. **Inline XBRL**: iXBRL tags mixed with HTML
   - `ix:nonfraction`, `ix:footnote`, `ix:exclude`
   - Must preserve or strip depending on use case

### Section Detection Gotchas
1. **Multiple detection methods**: TOC-based vs pattern-based
   - TOC more reliable but not always present
   - Pattern matching is fallback

2. **Item number variations**:
   - "Item 1", "ITEM 1", "Item 1.", "Item 1 -"
   - Must handle all variations in patterns

3. **Section boundaries**: Tricky to determine exact end
   - Use next section start as end
   - Last section extends to end of document

4. **Table cells**: Item headers sometimes in table cells
   - Must check table cell content

---

## 13. TypeScript Migration Strategy

### Phase 1: Core SGML Parsing
1. Implement SGMLParser with format detection
2. Parse header and documents
3. Extract HTML from SGML
4. Test with real 10-K filings

### Phase 2: HTML Parsing
1. Select HTML parser (cheerio recommended)
2. Implement DocumentBuilder
3. Create node tree from HTML
4. Test node structure matches Python

### Phase 3: Section Detection
1. Implement pattern-based section extractor
2. Add 10-K section patterns
3. Extract sections from node tree
4. Optionally: Add TOC-based extractor

### Phase 4: Integration
1. Create Filing class
2. Create TenK class
3. Wire up full pipeline
4. End-to-end testing

### Recommended Libraries

**HTTP**: `axios`
```typescript
import axios from 'axios';
const response = await axios.get(url);
```

**HTML Parsing**: `cheerio`
```typescript
import * as cheerio from 'cheerio';
const $ = cheerio.load(html);
```

**Validation**: `zod`
```typescript
import { z } from 'zod';
const FilingSchema = z.object({
  cik: z.number(),
  company: z.string(),
  ...
});
```

**String Matching**: `string-similarity`
```typescript
import stringSimilarity from 'string-similarity';
```

---

## Summary

### Essential Modules for 10-K Parsing
1. ✅ SGML Parser (sgml_parser.py, sgml_common.py, sgml_header.py)
2. ✅ HTML Parser (parser.py, document_builder.py)
3. ✅ Node Tree (nodes.py, types.py)
4. ✅ Section Extraction (pattern_section_extractor.py)
5. ✅ Document Model (document.py)
6. ✅ Filing Class (_filings.py - partial)
7. ✅ TenK Class (ten_k.py)

### External Dependencies Required
1. ✅ HTTP client (httpx → axios)
2. ✅ HTML parser (lxml → cheerio/jsdom)
3. ✅ Validation (pydantic → zod)
4. ✅ String matching (rapidfuzz → string-similarity)

### Estimated Migration Effort
- **Total Code**: ~5,200 lines of Python core logic
- **External Dependencies**: 4 major libraries to replace
- **Complexity**: Medium (well-structured, clear separation)
- **Risk Areas**: SGML parsing quirks, HTML malformation handling

### Next Steps
1. Set up TypeScript project structure
2. Choose and install dependencies (axios, cheerio, zod)
3. Start with SGML parser (most fundamental)
4. Build upward through the stack
5. Test with real 10-K filings at each stage

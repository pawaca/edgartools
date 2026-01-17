# 10-K Parsing Flow Diagram

## Component Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Entry Point                              │
│                                                                         │
│  filing = Filing(cik, company, form, filing_date, accession_no)       │
│  ten_k = filing.obj()  # Returns TenK instance                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      STAGE 1: SGML PARSING                              │
│  edgar/sgml/                                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filing.sgml() ──────────────────────┐                                 │
│      │                                │                                 │
│      ├─ Download text file from SEC  │                                 │
│      │  (https://sec.gov/.../0001....txt)                             │
│      │                                │                                 │
│      └─ SGMLParser ───────────────────┤                                 │
│             │                         │                                 │
│             ├─ detect_format() ───────┤                                 │
│             │   • SUBMISSION format   │                                 │
│             │   • SEC_DOCUMENT format │                                 │
│             │                         │                                 │
│             ├─ parse_header() ────────┤                                 │
│             │   → FilingHeader        │                                 │
│             │      • Metadata         │                                 │
│             │      • Filer info       │                                 │
│             │      • Addresses        │                                 │
│             │                         │                                 │
│             └─ parse_documents() ─────┤                                 │
│                 → List[SGMLDocument]  │                                 │
│                    • type             │                                 │
│                    • sequence         │                                 │
│                    • filename         │                                 │
│                    • description      │                                 │
│                    • raw_content      │                                 │
│                                       │                                 │
│  Returns: FilingSGML(header, docs) ◄──┘                                 │
│      • attachments                                                      │
│      • html() method                                                    │
│      • xml() method                                                     │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   STAGE 2: HTML EXTRACTION                              │
│  edgar/sgml/sgml_common.py                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  FilingSGML.html() ──────────────────┐                                 │
│      │                                │                                 │
│      ├─ Get attachments.primary_html_document                          │
│      │                                │                                 │
│      └─ SGMLDocument.content ─────────┤                                 │
│             │                         │                                 │
│             ├─ Extract <TEXT> tag    │                                 │
│             ├─ Or <HTML> tag         │                                 │
│             └─ Decode if UU-encoded  │                                 │
│                                       │                                 │
│  Returns: HTML string ◄───────────────┘                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    STAGE 3: HTML PARSING                                │
│  edgar/documents/parser.py                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HTMLParser.parse(html) ─────────────┐                                 │
│      │                                │                                 │
│      ├─ 1. Store original_html ──────┤                                 │
│      │                                │                                 │
│      ├─ 2. Extract XBRL facts ────────┤                                 │
│      │     (ix:nonfraction, etc.)    │                                 │
│      │                                │                                 │
│      ├─ 3. Preprocess HTML ───────────┤                                 │
│      │     • Remove ix:hidden        │                                 │
│      │     • Normalize whitespace    │                                 │
│      │     • Clean markup            │                                 │
│      │                                │                                 │
│      ├─ 4. Parse with lxml ───────────┤                                 │
│      │     lxml.html.fromstring()    │                                 │
│      │     → HtmlElement tree        │                                 │
│      │                                │                                 │
│      ├─ 5. Extract metadata ──────────┤                                 │
│      │     • form, company, cik      │                                 │
│      │     • dates                   │                                 │
│      │     • Store original_html     │                                 │
│      │                                │                                 │
│      ├─ 6. Build document ────────────┤                                 │
│      │     DocumentBuilder.build()   │                                 │
│      │     → DocumentNode tree       │                                 │
│      │                                │                                 │
│      └─ 7. Postprocess ───────────────┤                                 │
│          • Merge adjacent nodes      │                                 │
│          • Cleanup whitespace        │                                 │
│                                       │                                 │
│  Returns: Document(root, metadata) ◄──┘                                 │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              STAGE 4: DOCUMENT TREE BUILDING                            │
│  edgar/documents/strategies/document_builder.py                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DocumentBuilder.build(tree) ────────┐                                 │
│      │                                │                                 │
│      └─ _process_element(element, parent)                              │
│             │                         │                                 │
│             ├─ Determine element type:                                 │
│             │   • BLOCK (div, p, h1-h6, table, ul, ol)                │
│             │   • INLINE (span, a, strong, em)                        │
│             │   • SKIP (script, style, meta)                          │
│             │                         │                                 │
│             ├─ Extract and parse style:                                │
│             │   • font-size, font-weight                              │
│             │   • text-align, margins                                 │
│             │   • colors, padding                                     │
│             │                         │                                 │
│             ├─ Create appropriate Node:                                │
│             │   • HeadingNode (h1-h6) │                                 │
│             │   • ParagraphNode (p)   │                                 │
│             │   • TableNode (table)   │                                 │
│             │   • ListNode (ul, ol)   │                                 │
│             │   • TextNode (text)     │                                 │
│             │   • SectionNode         │                                 │
│             │                         │                                 │
│             └─ Recurse for children ──┤                                 │
│                 (depth-first traversal)│                                │
│                                       │                                 │
│  Returns: DocumentNode tree ◄─────────┘                                 │
│      • Hierarchical structure                                          │
│      • Each node has: id, type, content, style, metadata              │
│      • Tree methods: text(), html(), find(), walk()                   │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              STAGE 5: SECTION DETECTION                                 │
│  edgar/documents/extractors/                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Document.sections (lazy property)                                     │
│      │                                                                 │
│      ├─ Pattern-based extraction ─────┐                                │
│      │   pattern_section_extractor.py │                                │
│      │        │                        │                                │
│      │        ├─ Traverse node tree   │                                │
│      │        ├─ Match headings:      │                                │
│      │        │   r'^Item\s+1\.'      │                                │
│      │        │   r'^Item\s+1A\.'     │                                │
│      │        │   r'^Item\s+7\.'      │                                │
│      │        │   etc.                │                                │
│      │        ├─ Find boundaries      │                                │
│      │        └─ Extract content ──┐  │                                │
│      │                             │  │                                │
│      └─ TOC-based extraction ───────┐│                                │
│          toc_section_extractor.py  ││                                │
│               │                     ││                                │
│               ├─ Parse original_html                                   │
│               ├─ Find Table of Contents                                │
│               ├─ Extract anchor mappings:                              │
│               │   "Item 1" → "#item_1_anchor"                         │
│               │   "Item 1A" → "#item_1a_anchor"                       │
│               ├─ Locate elements by ID                                 │
│               └─ Extract content by ranges                             │
│                                     ││                                │
│                                     ││                                │
│  Returns: Map<string, Section> ◄────┴┘                                │
│      • business: Section(name, title, node, offsets)                  │
│      • risk_factors: Section(...)                                     │
│      • mda: Section(...)                                              │
│      • financial_statements: Section(...)                             │
│      • etc.                                                            │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   STAGE 6: TENK OBJECT                                  │
│  edgar/company_reports/ten_k.py                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  TenK(filing) ───────────────────────┐                                 │
│      │                                │                                 │
│      ├─ document property ────────────┤                                 │
│      │   → HTMLParser.parse(filing.html())                            │
│      │   → Returns Document           │                                 │
│      │                                │                                 │
│      ├─ sections property ─────────────┤                                 │
│      │   → document.sections          │                                 │
│      │   → Map friendly names:        │                                 │
│      │      'business' → Item 1       │                                 │
│      │      'risk_factors' → Item 1A  │                                 │
│      │      'mda' → Item 7            │                                 │
│      │                                │                                 │
│      ├─ items property ────────────────┤                                 │
│      │   → List of Item numbers       │                                 │
│      │      ['Item 1', 'Item 1A', ...]                                │
│      │                                │                                 │
│      └─ Convenience properties ────────┤                                 │
│          • business → sections['business']                             │
│          • risk_factors → sections['risk_factors']                     │
│          • mda → sections['mda']      │                                 │
│                                       │                                 │
│  Returns: TenK object ◄────────────────┘                                │
│      • Full access to parsed 10-K                                      │
│      • Section-by-section navigation                                   │
│      • Text and HTML extraction                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Structure Diagram

```
Filing
├── cik: number
├── company: string
├── form: string
├── filing_date: string
├── accession_no: string
└── Methods:
    ├── sgml() → FilingSGML
    ├── html() → string
    └── obj() → TenK

FilingSGML
├── header: FilingHeader
│   ├── accession_number
│   ├── filing_date
│   ├── form
│   ├── filers: List[Filer]
│   └── metadata: FilingMetadata
├── documents: Map<sequence, SGMLDocument[]>
├── attachments: Attachments
└── Methods:
    ├── html() → string
    └── xml() → string

Document
├── root: DocumentNode
├── metadata: DocumentMetadata
│   ├── form, company, cik
│   ├── filing_date, report_date
│   ├── size, parse_time
│   ├── xbrl_data
│   └── original_html
└── sections: Map<name, Section>
    └── Methods:
        ├── text() → string
        ├── html() → string
        └── findTables() → Table[]

Node (Abstract)
├── id: UUID
├── type: NodeType
├── parent: Node | null
├── children: Node[]
├── content: any
├── metadata: Record<string, any>
├── style: Style
│   ├── font_size, font_weight
│   ├── text_align, margins
│   └── colors, padding
└── Methods:
    ├── text() → string
    ├── html() → string
    ├── find(predicate) → Node[]
    └── walk() → Iterator<Node>

├─ DocumentNode
├─ SectionNode
├─ HeadingNode
├─ ParagraphNode
├─ TextNode
├─ TableNode
│  ├── rows: Row[]
│  └── Row
│      └── cells: Cell[]
├─ ListNode
├─ ListItemNode
├─ LinkNode
└─ ImageNode

Section
├── name: string (e.g., "business", "risk_factors")
├── title: string (e.g., "Item 1 - Business")
├── node: SectionNode
├── start_offset: number
├── end_offset: number
├── confidence: number
├── detection_method: 'toc' | 'heading' | 'pattern'
├── part?: string (for 10-Q: "I" or "II")
├── item?: string (e.g., "1", "1A", "7")
└── Methods:
    ├── text() → string
    ├── html() → string
    └── tables() → Table[]

TenK
├── filing: Filing
├── document: Document (cached)
├── sections: Map<string, Section>
├── items: string[] (e.g., ["Item 1", "Item 1A", ...])
└── Convenience:
    ├── business → Section
    ├── risk_factors → Section
    ├── mda → Section
    └── financial_statements → Section
```

## Processing Pipeline Summary

```
SEC Filing (.txt)
    ↓
[SGML Parser]
    • Detect format
    • Parse header
    • Parse documents
    ↓
FilingSGML
    ↓
[HTML Extraction]
    • Get primary document
    • Extract <HTML> content
    • Decode if needed
    ↓
HTML String
    ↓
[HTML Parser]
    • Preprocess
    • Parse with lxml
    • Extract metadata
    ↓
lxml Tree
    ↓
[Document Builder]
    • Traverse elements
    • Extract styles
    • Create nodes
    • Build hierarchy
    ↓
Document (Node Tree)
    ↓
[Section Extractor]
    • Pattern matching
    • OR TOC analysis
    • Extract boundaries
    • Create sections
    ↓
Document with Sections
    ↓
[TenK Object]
    • Map sections
    • Provide convenience methods
    • Enable text/HTML access
    ↓
Final TenK Object
```

## Key File Locations

```
edgar/
├── __init__.py                  # obj() factory function
├── _filings.py                  # Filing class (entry point)
│
├── sgml/                        # SGML parsing
│   ├── __init__.py
│   ├── sgml_parser.py          # Main SGML parser
│   ├── sgml_common.py          # FilingSGML class
│   └── sgml_header.py          # Header parsing
│
├── documents/                   # HTML parsing and document model
│   ├── __init__.py
│   ├── parser.py               # HTMLParser (orchestrator)
│   ├── document.py             # Document, Section classes
│   ├── nodes.py                # Node hierarchy
│   ├── types.py                # Enums and type definitions
│   ├── config.py               # ParserConfig
│   │
│   ├── strategies/             # Parsing strategies
│   │   ├── document_builder.py # Tree building
│   │   ├── header_detection.py # Header detection
│   │   ├── table_processing.py # Table extraction
│   │   └── xbrl_extraction.py  # XBRL fact extraction
│   │
│   ├── extractors/             # Section extraction
│   │   ├── pattern_section_extractor.py  # Pattern-based
│   │   └── toc_section_extractor.py      # TOC-based
│   │
│   └── utils/                  # Utilities
│       ├── toc_analyzer.py     # TOC detection
│       └── html_utils.py       # HTML helpers
│
└── company_reports/            # Report classes
    ├── __init__.py
    ├── ten_k.py                # TenK class
    ├── ten_q.py                # TenQ class
    └── _base.py                # CompanyReport base
```

## External Dependencies per Stage

```
STAGE 1: SGML Parsing
    • No external libs (pure Python regex)
    → TypeScript: Pure TS regex

STAGE 2: HTML Extraction
    • No external libs (string operations)
    → TypeScript: Pure TS strings

STAGE 3: HTML Parsing
    • lxml (C-based XML/HTML parser)
    → TypeScript: cheerio or jsdom

STAGE 4: Document Building
    • lxml.html (DOM traversal)
    → TypeScript: cheerio (jQuery-like)

STAGE 5: Section Detection
    • lxml.html (XPath queries)
    → TypeScript: cheerio selectors or xpath package

STAGE 6: TenK Object
    • No external libs (pure Python)
    → TypeScript: Pure TS classes
```

## Critical Algorithms

### 1. SGML Tag Parsing
```python
# Line-by-line state machine
for line in lines:
    if is_section_start(line):
        # Push to stack
        current_path.append(tag)
    elif is_section_end(line):
        # Pop from stack
        current_path.pop()
    elif is_data_tag(line):
        # Extract tag and value
        tag, value = parse_tag(line)
        store(current_path, tag, value)
```

### 2. HTML Tree Building
```python
# Recursive element processing
def process_element(element, parent_node):
    # Determine node type
    if is_heading(element):
        node = HeadingNode()
    elif is_paragraph(element):
        node = ParagraphNode()
    # ...

    # Extract style
    node.style = parse_style(element)

    # Process children
    for child in element.children:
        child_node = process_element(child, node)
        node.add_child(child_node)

    return node
```

### 3. Section Detection (Pattern-based)
```python
# Traverse tree, match patterns
for node in document.root.walk():
    if isinstance(node, HeadingNode):
        text = node.text().strip()
        for section_name, patterns in SECTION_PATTERNS.items():
            for pattern, title in patterns:
                if re.match(pattern, text):
                    # Found section start
                    sections[section_name] = Section(
                        name=section_name,
                        title=title,
                        node=create_section_node(node, next_node),
                        detection_method='pattern'
                    )
```

### 4. Section Detection (TOC-based)
```python
# Find TOC, extract anchors
toc_links = find_toc(html)  # {section_name: anchor_id}

for section_name, anchor_id in toc_links.items():
    # Find element with id=anchor_id
    element = tree.xpath(f'//*[@id="{anchor_id}"]')[0]

    # Determine boundaries
    start = element
    end = find_next_section_start(element, toc_links)

    # Extract content
    sections[section_name] = Section(
        name=section_name,
        node=extract_content(start, end),
        detection_method='toc'
    )
```

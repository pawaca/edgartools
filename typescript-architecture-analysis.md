# EdgarTools Python Architecture Analysis for TypeScript Port

## Executive Summary

This document analyzes the Python edgartools architecture to ensure the TypeScript port accurately reflects the implementation patterns, data flows, and design decisions. The analysis covers filing parsing, document structure, SGML handling, and section detection strategies.

**Key Finding**: Python edgartools uses a **multi-layered, strategy-based architecture** with lazy evaluation, multiple fallback mechanisms, and confidence-scored detection methods.

---

## 1. Filing and Company Reports Architecture

### 1.1 Class Hierarchy

```
CompanyReport (base)
├── TenK (10-K annual reports)
├── TenQ (10-Q quarterly reports)
└── EightK/CurrentReport (8-K current reports)
```

#### CompanyReport Base Class
**File**: `edgar/company_reports/_base.py`

**Core Pattern**: Property-based lazy evaluation with caching

```python
class CompanyReport:
    def __init__(self, filing):
        self._filing = filing
        self._parser = None  # Lazy init

    @cached_property
    def document(self) -> Document:
        """Primary API - returns new HTMLParser Document"""
        if self._parser is None:
            config = ParserConfig(form=self._filing.form)
            self._parser = HTMLParser(config)
        return self._parser.parse(self._filing.html())

    @cached_property
    def chunked_document(self):
        """Deprecated legacy parser (backward compat)"""
        warnings.warn("Use document instead", DeprecationWarning)
        return ChunkedDocument(self._filing.html())
```

**Key Observations**:
1. **Dual parser support**: New `HTMLParser` + legacy `ChunkedDocument` for backward compatibility
2. **Lazy initialization**: Document parsing delayed until first access
3. **Cached properties**: Parse once, cache forever per instance
4. **Config-driven**: Form type passed to parser for section detection

---

### 1.2 TenK Implementation

**File**: `edgar/company_reports/ten_k.py:49-622`

#### Structure Definition (Lines 50-161)

```python
class TenK(CompanyReport):
    structure = FilingStructure({
        "PART I": {
            "ITEM 1": {
                "Title": "Business",
                "Description": "Overview of company's business operations..."
            },
            "ITEM 1A": {"Title": "Risk Factors", ...},
            # ... all items
        },
        "PART II": {...},
        "PART III": {...},
        "PART IV": {...}
    })
```

**Critical Detail**: This is a **class-level constant**, not instance data. It defines the SEC's official 10-K structure.

#### Document Property (Lines 167-198)

```python
@cached_property
def document(self):
    """Parse 10-K using new HTMLParser with enhanced section detection."""
    try:
        html = self._filing.html()
        if not html:
            return None
        config = ParserConfig(form='10-K')
        parser = HTMLParser(config)
        return parser.parse(html)
    except Exception as e:
        import warnings
        warnings.warn(
            f"HTMLParser failed (falling back to ChunkedDocument): {e}",
            RuntimeWarning
        )
        return None
```

**Pattern**: Try/catch with fallback to None (NOT fallback to old parser)

#### Sections Property (Lines 200-218)

```python
@property
def sections(self):
    """Get detected 10-K sections using new parser."""
    if self.document:
        return self.document.sections  # Returns Sections dict
    return {}  # Empty dict if parsing failed
```

**Key**: Direct delegation to Document.sections (which triggers detection)

#### Items Property (Lines 220-277)

**Complex mapping logic**:
1. First tries new parser sections
2. Maps friendly names ("business", "risk_factors") to "Item X" format
3. Falls back to chunked_document if new parser returns no sections

```python
@property
def items(self) -> List[str]:
    section_to_item = {
        'business': 'Item 1',
        'risk_factors': 'Item 1A',
        'mda': 'Item 7',
        # ... full mapping
    }

    if self.sections:
        items = []
        for key, section in self.sections.items():
            if hasattr(section, 'item') and section.item:
                items.append(f"Item {section.item}")
            elif key in section_to_item:
                items.append(section_to_item[key])
        return items or self.chunked_document.list_items()

    return self.chunked_document.list_items() if self.chunked_document else []
```

#### __getitem__ Method (Lines 328-524)

**CRITICAL**: Most complex method with **5-priority lookup cascade**:

```python
def __getitem__(self, item_or_part: str):
    # Mapping dictionaries
    item_to_section = {'Item 1': 'business', 'Item 1A': 'risk_factors', ...}
    section_to_item = {'business': 'Item 1', ...}  # Reverse

    if self.sections:
        normalized = item_or_part.strip()

        # PRIORITY 1: Part-based naming (most reliable)
        # Try "part_i_item_1", "part_ii_item_5", etc.
        item_num = extract_item_number(normalized)
        if item_num:
            for part in ['i', 'ii', 'iii', 'iv']:
                key = f'part_{part}_item_{item_num}'
                if key in self.sections:
                    return self.sections[key].text()

        # PRIORITY 2: Direct key lookup
        if item_or_part in self.sections:
            return self.sections[item_or_part].text()

        # PRIORITY 3: Friendly name -> Item mapping
        if item_or_part in section_to_item:
            item_key = section_to_item[item_or_part]
            if item_key in self.sections:
                return self.sections[item_key].text()

        # PRIORITY 4: 'Item X' format -> friendly name
        if normalized in item_to_section:
            friendly = item_to_section[normalized]
            if friendly in self.sections:
                return self.sections[friendly].text()

        # PRIORITY 5: Short format ('1', '1A') -> 'Item X'
        if re.match(r'^\d+[A-Z]?$', normalized):
            item_key = f'Item {normalized.upper()}'
            if item_key in self.sections or map_to_friendly...

    # Cross Reference Index fallback (line 492-505)
    if self._cross_reference_index is not None:
        item_text = self._cross_reference_index.extract_item_content(...)
        if item_text:
            return clean_item_text(item_text)

    # Final fallback to chunked_document with deprecation warning
    log.warning(f"TenK falling back to legacy parser for '{item_or_part}'")
    return self.chunked_document[item_or_part]
```

**Key Patterns**:
- Multiple name formats supported: "Item 1", "1", "business", "part_i_item_1"
- Cascading fallbacks with explicit priorities
- Logging at fallback points for deprecation tracking
- Cross Reference Index handling (special case for GE, Henry Schein)

---

### 1.3 TenQ Implementation

**File**: `edgar/company_reports/ten_q.py:22-409`

**Key Difference**: 10-Q has **part-qualified items** due to duplicate item numbers

```python
class TenQ(CompanyReport):
    structure = FilingStructure({
        "PART I": {  # Financial Information
            "ITEM 1": {"Title": "Financial Statements", ...},
            "ITEM 2": {"Title": "MD&A", ...},
            "ITEM 3": {"Title": "Market Risk", ...},
            "ITEM 4": {"Title": "Controls and Procedures", ...}
        },
        "PART II": {  # Other Information
            "ITEM 1": {"Title": "Legal Proceedings", ...},  # Same number!
            "ITEM 1A": {"Title": "Risk Factors", ...},
            "ITEM 2": {"Title": "Unregistered Sales", ...},
            # ... up to Item 6
        }
    })
```

#### Items Property (Lines 124-170)

**Returns part-qualified format**: `['Part I, Item 1', 'Part II, Item 1', ...]`

```python
@property
def items(self) -> List[str]:
    if self.sections:
        items = []
        for key, section in self.sections.items():
            if key.startswith('part_'):
                part = 'Part I' if key.startswith('part_i_') else 'Part II'
                item_match = re.search(r'item_(\d+[a-z]?)', key, re.IGNORECASE)
                if item_match:
                    item_num = item_match.group(1).upper()
                    items.append(f"{part}, Item {item_num}")
        return items or self.chunked_document.list_items()

    return self.chunked_document.list_items()
```

#### __getitem__ Method (Lines 172-267)

**Handles part-qualified lookups**:

```python
def __getitem__(self, item_or_part: str) -> Optional[str]:
    if self.sections:
        # Direct key lookup first
        if item_or_part in self.sections:
            return self.sections[item_or_part].text()

        # Parse 'Part I, Item X' or 'Part II, Item X'
        part_item_match = re.match(
            r'part\s+(i{1,2}|1|2)\s*,?\s*item\s+(\d+[a-z]?)',
            item_or_part.lower()
        )
        if part_item_match:
            part_num = part_item_match.group(1).lower()
            item_num = part_item_match.group(2).lower()
            key = f'part_{"i" if part_num in ["i","1"] else "ii"}_item_{item_num}'
            if key in self.sections:
                return self.sections[key].text()

        # Handle 'Item X' - tries Part I first, then Part II
        item_match = re.match(r'item\s+(\d+[a-z]?)', item_or_part.lower())
        if item_match:
            item_num = item_match.group(1).lower()
            for part in ['i', 'ii']:
                key = f'part_{part}_item_{item_num}'
                if key in self.sections:
                    return self.sections[key].text()

    # Fallback to chunked_document
    log.warning(f"TenQ falling back to legacy parser...")
    return self.chunked_document[item_or_part]
```

**Critical for TypeScript**: Must support both "Part I, Item 1" and "Item 1" lookups

---

### 1.4 EightK/CurrentReport Implementation

**File**: `edgar/company_reports/current_report.py:20-1061`

**Key Difference**: Uses **decimal item numbering** (1.01, 2.02, 5.07, etc.)

#### Item Structure (Lines 42-1061)

```python
# 8-K uses ItemOnlyFilingStructure (no parts)
structure = ItemOnlyFilingStructure({
    'item_101': {'number': '1.01', 'title': 'Entry into Material Agreement', ...},
    'item_201': {'number': '2.01', 'title': 'Completion of Acquisition', ...},
    'item_202': {'number': '2.02', 'title': 'Results of Operations', ...},
    'item_701': {'number': '7.01', 'title': 'Regulation FD Disclosure', ...},
    'item_801': {'number': '8.01', 'title': 'Other Events', ...},
    'item_901': {'number': '9.01', 'title': 'Financial Statements and Exhibits', ...},
})
```

#### Item Number Normalization (Lines 23-48)

```python
def _normalize_item_number(item_str: str) -> str:
    """
    Normalize item string to standard format (e.g., '2.02').

    Handles:
    - "Item 2.02" -> "2.02"
    - "Item 2. 02" -> "2.02"  (Apple-style spacing)
    - "ITEM 2.02" -> "2.02"   (case variation)
    """
    cleaned = re.sub(r'^item\s+', '', item_str.lower().strip())
    cleaned = re.sub(r'\s*\.\s*', '.', cleaned)  # "2. 02" -> "2.02"
    cleaned = cleaned.rstrip('.')
    return cleaned
```

---

## 2. Document Parsing Architecture

### 2.1 HTMLParser Flow

**File**: `edgar/documents/parser.py:23-386`

#### Parse Pipeline (Lines 80-175)

```python
def parse(self, html: Union[str, bytes]) -> Document:
    start_time = time.time()

    # 1. Validation
    if not isinstance(html, (str, bytes)):
        raise TypeError(f"HTML must be string or bytes")
    if isinstance(html, bytes):
        html = html.decode('utf-8', errors='replace')

    # 2. Size check
    doc_size = len(html.encode('utf-8'))
    if doc_size > self.config.max_document_size:
        raise DocumentTooLargeError(...)

    # 3. Streaming check
    if doc_size > self.config.streaming_threshold:
        return self._parse_streaming(html)

    # 4. Store ORIGINAL HTML (before preprocessing)
    original_html = html

    # 5. Extract XBRL BEFORE preprocessing (preserves ix:hidden)
    xbrl_facts = []
    if self.config.extract_xbrl:
        xbrl_facts = self._extract_xbrl_pre_process(html)

    # 6. Preprocess (normalizes, removes ix:hidden)
    html = self.preprocessor.process(html)

    # 7. Parse with lxml
    tree = self._parse_html(html)

    # 8. Extract metadata
    metadata = self._extract_metadata(tree, html)
    metadata.preserve_whitespace = self.config.preserve_whitespace
    metadata.original_html = original_html  # CRITICAL for TOC

    # 9. Build document tree
    document = self._build_document(tree, metadata)

    # 10. Store config reference
    document._config = self.config

    # 11. Postprocess
    document = self.postprocessor.process(document)

    # 12. Record metrics
    document.metadata.parse_time = time.time() - start_time
    document.metadata.size = doc_size

    return document
```

**Critical Points**:
1. **Original HTML preservation**: Stored BEFORE preprocessing for TOC analysis
2. **XBRL extraction timing**: BEFORE preprocessing to capture hidden content
3. **Config reference**: Stored on document for lazy section detection
4. **Error handling**: Specific exceptions vs. generic errors

---

### 2.2 Document Structure

**File**: `edgar/documents/document.py:593-1133`

#### Document Class (Lines 593-1133)

```python
@dataclass
class Document:
    root: Node
    metadata: DocumentMetadata = field(default_factory=DocumentMetadata)

    # Cached extractions (private, lazy-loaded)
    _sections: Optional[Sections] = field(default=None, init=False, repr=False)
    _tables: Optional[List[TableNode]] = field(default=None, init=False, repr=False)
    _text_cache: Optional[str] = field(default=None, init=False, repr=False)
    _config: Optional[Any] = field(default=None, init=False, repr=False)

    @property
    def sections(self) -> Sections:
        """Lazy section detection with hybrid multi-strategy approach."""
        if self._sections is None:
            # Get form type from config or metadata
            form = self._config.form if self._config else self.metadata.form
            base_form = form.replace('/A', '') if form else None

            if base_form in ['10-K', '10-Q', '8-K', '20-F']:
                from edgar.documents.extractors.hybrid_section_detector import HybridSectionDetector
                detector = HybridSectionDetector(self, base_form, self._config.detection_thresholds)
                detected_sections = detector.detect_sections()
            else:
                # Fallback to pattern-based
                from edgar.documents.extractors.pattern_section_extractor import SectionExtractor
                extractor = SectionExtractor(form) if form else SectionExtractor()
                detected_sections = extractor.extract(self)

            self._sections = Sections(detected_sections)

        return self._sections
```

**Key Patterns**:
- **Lazy evaluation**: Sections not detected until first access
- **Form-based strategy selection**: Different detectors for different forms
- **Amendment handling**: `/A` suffix stripped for detection
- **Caching**: Once detected, sections cached for lifetime

#### Section Class (Lines 68-369)

```python
@dataclass
class Section:
    name: str
    title: str
    node: SectionNode
    start_offset: int = 0
    end_offset: int = 0
    confidence: float = 1.0
    detection_method: str = 'unknown'  # 'toc', 'heading', 'pattern'
    validated: bool = False
    part: Optional[str] = None  # For 10-Q: "I", "II"
    item: Optional[str] = None  # "1", "1A", "2", etc.

    # TOC-specific fields (private)
    _text_extractor: Optional[Any] = field(default=None, repr=False)
    _html_source: Optional[str] = field(default=None, repr=False)
    _section_extractor: Optional[Any] = field(default=None, repr=False)

    def text(self, **kwargs) -> str:
        """Extract text with dual strategy."""
        # TOC-based sections use callback
        if self._text_extractor is not None:
            text = self._text_extractor(self.name, **kwargs)
        else:
            # Heading/pattern-based use node traversal
            from edgar.documents.extractors.text_extractor import TextExtractor
            extractor = TextExtractor(**kwargs)
            text = extractor.extract_from_node(self.node)

        return self._clean_boundary_artifacts(text)

    def _clean_boundary_artifacts(self, text: str) -> str:
        """Remove page headers, footers, trailing items."""
        # 1. Remove interior page headers (page + PART + Item)
        text = re.sub(r'\n\s*\d{1,3}\s*\n\s*PART\s+[IVX]+\s*\n\s*Item\s+\d+', '\n\n', text)

        # 2. Remove trailing page footer
        text = re.sub(r'\n\s*\d{1,3}\s*\n\s*PART\s+[IVX]+\s*\n\s*Item\s+\d+\s*$', '', text)

        # 3. Remove trailing Item headers
        text = re.sub(r'\n\s*Item\s+\d+[A-Za-z]?\.?\s*$', '', text)

        # 4. Remove trailing page numbers
        text = re.sub(r'\n\s*\d{1,3}\s*$', '', text)

        return text.rstrip()
```

**Critical**: Dual text extraction strategy based on detection method

#### Sections Dictionary (Lines 371-590)

**Enhanced dictionary with rich display**:

```python
class Sections(Dict[str, Section]):
    """Dictionary wrapper with rich display and flexible key access."""

    def get_item(self, item: str, part: Optional[str] = None) -> Optional[Section]:
        """Get section by item number with optional part."""
        item_clean = item.replace("Item ", "").strip().upper()
        part_clean = part.upper() if part else None

        for name, section in self.items():
            if section.item and section.item.upper() == item_clean:
                if part_clean is None or section.part.upper() == part_clean:
                    return section
        return None

    def __getitem__(self, key):
        """Enhanced getitem supporting multiple formats."""
        # 1. Standard dict lookup
        try:
            return super().__getitem__(key)
        except KeyError:
            pass

        # 2. Try as item number
        if isinstance(key, str):
            result = self.get_item(key)
            if result:
                return result

        # 3. Try as (part, item) tuple
        elif isinstance(key, tuple) and len(key) == 2:
            result = self.get_item(key[1], key[0])
            if result:
                return result

        raise KeyError(key)
```

---

## 3. SGML Handling

### 3.1 SGMLParser

**File**: `edgar/sgml/sgml_parser.py:150-594`

#### Format Detection (Lines 151-178)

```python
class SGMLParser:
    @staticmethod
    def detect_format(content: str) -> SGMLFormatType:
        """Detect SGML format based on root element."""
        content_stripped = content.lstrip()

        # Check valid SGML first
        if content_stripped.startswith('<SUBMISSION>'):
            return SGMLFormatType.SUBMISSION
        elif '<SEC-DOCUMENT>' in content:
            return SGMLFormatType.SEC_DOCUMENT
        elif '<IMS-DOCUMENT>' in content:  # 1990s filings
            return SGMLFormatType.SEC_DOCUMENT
        elif '<DOCUMENT>' in content[:1000]:
            return SGMLFormatType.SEC_DOCUMENT

        # Check for HTML error responses
        if has_html_content(content):
            _raise_sec_html_error(content)

        # Check for XML errors
        if content_stripped.startswith('<?xml') and '<Error>' in content:
            _raise_sec_html_error(content)

        raise ValueError("Unknown SGML format")
```

#### Document Parsing

```python
def parse(self, content) -> dict:
    """Main entry point."""
    format_type = self.detect_format(content)

    if format_type == SGMLFormatType.SUBMISSION:
        return self._parse_submission_format(content)
    else:
        return self._parse_sec_document_format(content)
```

**Output structure**:
```python
{
    'format': SGMLFormatType,
    'header': str,  # Full header text
    'documents': [
        {
            'type': str,  # e.g., '10-K', 'EX-21.1'
            'sequence': str,
            'filename': str,
            'description': str,
            'content': str  # Raw SGML content with tags
        },
        ...
    ]
}
```

### 3.2 SGMLDocument

**File**: `edgar/sgml/sgml_parser.py:34-109`

```python
@dataclass
class SGMLDocument:
    type: str
    sequence: str
    filename: str
    description: str
    raw_content: str = ""

    @property
    def content(self):
        """Smart content extraction with UU-decode support."""
        raw_content = get_content_between_tags(self.raw_content)
        if raw_content and raw_content.startswith("begin"):
            # UU-encoded content (binary files)
            import warnings
            warnings.filterwarnings('ignore')
            input_stream = BytesIO(raw_content.encode("utf-8"))
            output_stream = BytesIO()
            uu.decode(input_stream, output_stream, quiet=True)
            return output_stream.getvalue()
        return raw_content

    def text(self) -> str:
        """Extract content between <TEXT> tags."""
        match = re.search(r'<TEXT>([\s\S]*?)</TEXT>', self.raw_content, re.DOTALL)
        return match.group(1).strip() if match else ""

    def html(self) -> Optional[str]:
        """Extract content between <HTML> tags."""
        match = re.search(r'<HTML>([\s\S]*?)</HTML>', self.raw_content, re.DOTALL)
        return match.group(1).strip() if match else None

    def xml(self) -> Optional[str]:
        """Extract content between <XML> tags."""
        match = re.search(r'<XML>([\s\S]*?)</XML>', self.raw_content, re.DOTALL)
        return match.group(1).strip() if match else None
```

**Key**: Multiple content extraction methods for different tag types

### 3.3 FilingSGML

**File**: `edgar/sgml/sgml_common.py:222-397`

```python
@dataclass(slots=True)  # Memory efficient
class FilingSGML:
    header: FilingHeader
    _documents_by_sequence: Dict[str, SGMLDocument]

    @property
    def attachments(self) -> Attachments:
        """Get all documents as Attachments collection."""
        return Attachments([
            Attachment.from_sgml_document(doc, self.header)
            for doc in self._documents_by_sequence.values()
        ])

    def html(self):
        """Get primary HTML document content."""
        html_document = self.attachments.primary_html_document
        if html_document and not html_document.is_binary():
            return self.get_content(html_document.document)
        return None

    def get_content(self, document: SGMLDocument) -> str:
        """Extract content from document."""
        # Try HTML tag first
        html = document.html()
        if html:
            return html

        # Try TEXT tag
        text = document.text()
        if text:
            return text

        # Try XML tag
        xml = document.xml()
        if xml:
            return xml

        # Fallback to raw content
        return document.content
```

---

## 4. Section Detection Strategies

### 4.1 Hybrid Multi-Strategy Approach

**File**: `edgar/documents/extractors/hybrid_section_detector.py:22-200`

#### Strategy Cascade (Lines 55-84)

```python
class HybridSectionDetector:
    def detect_sections(self) -> Dict[str, Section]:
        """Hybrid approach with fallback and validation."""

        # Strategy 1: TOC-based (most reliable, 0.95 confidence)
        logger.debug("Trying TOC-based detection...")
        sections = self.toc_detector.detect()
        if sections:
            logger.info(f"TOC: {len(sections)} sections")
            return self._validate_pipeline(sections, enable_cross_validation=True)

        # Strategy 2: Heading-based (fallback, 0.7-0.9 confidence)
        logger.debug("TOC failed, trying heading detection...")
        sections = self._try_heading_detection()
        if sections:
            logger.info(f"Heading: {len(sections)} sections")
            return self._validate_pipeline(sections, enable_cross_validation=False)

        # Strategy 3: Pattern-based (last resort, 0.6 confidence)
        logger.debug("Heading failed, trying pattern matching...")
        sections = self._try_pattern_detection()
        if sections:
            logger.info(f"Pattern: {len(sections)} sections")
            return self._validate_pipeline(sections, enable_cross_validation=False)

        logger.warning("All strategies failed")
        return {}
```

**Key Pattern**: Try strategies in reliability order, each with fallback

#### Validation Pipeline (Lines 86-119)

```python
def _validate_pipeline(
    self,
    sections: Dict[str, Section],
    enable_cross_validation: bool = False
) -> Dict[str, Section]:
    """Centralized validation."""
    if not sections:
        return sections

    # 1. Cross-validate (optional, expensive)
    if enable_cross_validation and self.thresholds.enable_cross_validation:
        sections = self._cross_validate(sections)

    # 2. Validate boundaries
    sections = self._validate_boundaries(sections)

    # 3. Deduplicate
    sections = self._deduplicate(sections)

    # 4. Filter by confidence
    sections = self._filter_by_confidence(sections)

    return sections
```

### 4.2 Pattern-Based Section Extractor

**File**: `edgar/documents/extractors/pattern_section_extractor.py:16-300`

#### Section Patterns (Lines 28-300)

**Pattern structure**:
```python
SECTION_PATTERNS = {
    '10-K': {
        'business': [
            (r'^(Item|ITEM)\s+1\.?\s*Business', 'Item 1 - Business'),
            (r'^Business\s*$', 'Business'),
            (r'^Business Overview', 'Business Overview'),
        ],
        'risk_factors': [
            (r'^(Item|ITEM)\s+1A\.?\s*Risk\s+Factors', 'Item 1A - Risk Factors'),
            (r'^Risk\s+Factors', 'Risk Factors'),
        ],
        'mda': [
            (r'^(Item|ITEM)\s+7\.?\s*Management.*Discussion', 'Item 7 - MD&A'),
            (r'^Management.*Discussion.*Analysis', 'MD&A'),
            (r'^MD&A', 'MD&A')
        ],
        # ... all sections
    },
    '10-Q': {
        'part_i_item_1': [
            (r'^(Item|ITEM)\s+1\.?\s*[-–—.]?\s*Financial\s+Statements', ...),
            (r'^Financial\s+Statements', ...),
        ],
        'part_ii_item_1': [
            (r'^(Item|ITEM)\s+1\.?\s*[-–—.]?\s*Legal\s+Proceedings', ...),
        ],
        # ... part-qualified sections
    },
    '20-F': {
        # ... comprehensive 20-F patterns
    },
    '8-K': {
        'item_101': [(r'^(Item|ITEM)\s+1\.\s*01', ...)],
        'item_201': [(r'^(Item|ITEM)\s+2\.\s*01', ...)],
        # ... decimal item patterns
    }
}
```

**Key Observations**:
1. Multiple pattern variations per section
2. Tuple format: `(regex_pattern, display_title)`
3. Form-specific pattern sets
4. 10-Q uses part-qualified keys: `part_i_item_1`, `part_ii_item_1`

### 4.3 TOC Section Detector

**File**: Referenced in hybrid detector, detailed implementation in `edgar/documents/extractors/toc_section_detector.py`

**High-level flow**:
1. Parse original HTML (before preprocessing)
2. Use TOCAnalyzer to find Table of Contents structure
3. Extract anchor-to-section mappings
4. Verify anchors exist in document
5. Create Section objects with 0.95 confidence
6. Store HTML source and extractor for lazy text extraction

---

## 5. Configuration

### 5.1 ParserConfig

**File**: `edgar/documents/config.py:31-212`

```python
@dataclass
class ParserConfig:
    # Performance
    max_document_size: int = 110 * 1024 * 1024  # 110MB
    streaming_threshold: int = 10 * 1024 * 1024  # 10MB
    cache_size: int = 1000
    enable_parallel: bool = True

    # Parsing
    strict_mode: bool = False
    extract_xbrl: bool = True
    extract_styles: bool = True
    preserve_whitespace: bool = False
    normalize_text: bool = True

    # AI optimization
    optimize_for_ai: bool = True
    max_token_estimation: int = 100_000

    # Table processing
    table_extraction: bool = True
    detect_table_types: bool = True
    fast_table_rendering: bool = True

    # Section detection
    detect_sections: bool = True
    eager_section_extraction: bool = False  # Lazy by default
    form: Optional[str] = None  # REQUIRED for detection
    detection_thresholds: DetectionThresholds = field(default_factory=DetectionThresholds)

    # Feature flags
    features: Dict[str, bool] = field(default_factory=lambda: {
        'ml_header_detection': True,
        'semantic_analysis': True,
        'table_understanding': True,
        'xbrl_validation': True,
        'auto_section_detection': True,
        'smart_text_extraction': True,
        'footnote_linking': True,
        'cross_reference_resolution': True
    })
```

**Key**: `form` parameter is critical for section detection

---

## 6. Critical Differences for TypeScript Port

### 6.1 Architecture Patterns

#### Python Uses:
1. **Cached properties** (`@cached_property`) - lazy, cache-forever
2. **Dataclasses** with slots for memory efficiency
3. **Multiple inheritance** (mixins)
4. **Context managers** and with statements
5. **Generator expressions** for lazy iteration
6. **Regex with named groups** for pattern matching
7. **Warning framework** for deprecations

#### TypeScript Should Use:
1. **Getters with private caching** (`get sections() { return this._sections ??= ... }`)
2. **Readonly class fields** or interfaces
3. **Interface composition** or abstract base classes
4. **Try-finally** or custom resource management
5. **Generator functions** (`function*`) or async iterators
6. **Named capture groups** in regex (ES2018+)
7. **Console warnings** or custom deprecation handler

### 6.2 Key Implementation Details

#### 1. Section Name Formats

**10-K** (part not needed):
- `"business"`, `"risk_factors"`, `"mda"` (friendly names)
- `"Item 1"`, `"Item 1A"`, `"Item 7"` (standard format)
- `"1"`, `"1A"`, `"7"` (short format)

**10-Q** (part required due to duplicates):
- `"part_i_item_1"`, `"part_ii_item_1"` (canonical format)
- `"Part I, Item 1"`, `"Part II, Item 1"` (display format)
- `"Item 1"` (ambiguous, defaults to Part I)

**8-K**:
- `"item_201"`, `"item_702"` (key format)
- `"2.01"`, `"7.02"` (decimal format)
- `"Item 2.01"`, `"Item 7.02"` (display format)

#### 2. Lazy Evaluation Pattern

Python:
```python
@cached_property
def document(self):
    if self._parser is None:
        self._parser = HTMLParser(config)
    return self._parser.parse(...)
```

TypeScript equivalent:
```typescript
private _document?: Document;
get document(): Document {
    if (!this._document) {
        const parser = new HTMLParser(config);
        this._document = parser.parse(...);
    }
    return this._document;
}
```

#### 3. Multi-Strategy Fallback

Python pattern:
```python
sections = strategy1.detect()
if sections:
    return validate(sections)

sections = strategy2.detect()
if sections:
    return validate(sections)

sections = strategy3.detect()
if sections:
    return validate(sections)

return {}
```

**DO NOT** use nested if/else - use early returns

#### 4. Error Handling

Python uses specific exception types:
```python
try:
    return self.document.sections
except HTMLParsingError:
    warnings.warn("Parser failed, falling back")
    return self.chunked_document.sections
```

TypeScript should mirror:
```typescript
try {
    return this.document.sections;
} catch (error) {
    if (error instanceof HTMLParsingError) {
        console.warn("Parser failed, falling back");
        return this.chunkedDocument.sections;
    }
    throw error;
}
```

#### 5. Section Text Extraction

**Dual strategy based on detection method**:

```python
def text(self):
    if self._text_extractor:  # TOC-based
        return self._text_extractor(self.name)
    else:  # Heading/pattern-based
        return extract_from_node(self.node)
```

TypeScript:
```typescript
text(): string {
    if (this._textExtractor) {
        return this._textExtractor(this.name);
    } else {
        return extractFromNode(this.node);
    }
}
```

#### 6. Confidence Scoring

**Always track detection confidence**:
- TOC-based: 0.95
- Heading-based: 0.7-0.9 (varies by signal strength)
- Pattern-based: 0.6-0.7

Store in Section object:
```typescript
interface Section {
    confidence: number;
    detectionMethod: 'toc' | 'heading' | 'pattern' | 'unknown';
    validated: boolean;
}
```

---

## 7. What TypeScript Likely Got Right

Based on common patterns:
1. Class-based structure (TenK, TenQ, EightK)
2. Section name mapping dictionaries
3. Regex pattern matching for sections
4. HTML parsing with lxml equivalent (jsdom, cheerio, or similar)
5. SGML document structure

---

## 8. What TypeScript Likely Got Wrong or Missed

### 8.1 Missing Features

1. **Hybrid multi-strategy detection**
   - TypeScript likely only implements one strategy (probably pattern-based)
   - Missing TOC-based detection (highest accuracy)
   - Missing heading-based detection (fallback)

2. **Confidence scoring**
   - Sections likely don't have confidence scores
   - No validation pipeline
   - No cross-validation or deduplication

3. **Part-qualified section names for 10-Q**
   - TypeScript might use `"item_1"` for both Part I and Part II
   - Should use `"part_i_item_1"` and `"part_ii_item_1"`

4. **Lazy evaluation**
   - Document parsing might be eager instead of lazy
   - Sections might be detected immediately instead of on first access

5. **Fallback mechanisms**
   - Missing Cross Reference Index fallback for special filings
   - Missing chunked_document fallback for legacy support

6. **Boundary artifact cleaning**
   - Section text might include page numbers, headers, footers
   - Python has sophisticated cleaning in `_clean_boundary_artifacts()`

7. **Original HTML preservation**
   - TOC detection requires ORIGINAL HTML before preprocessing
   - TypeScript might only store preprocessed HTML

8. **XBRL extraction timing**
   - Must extract BEFORE preprocessing to capture ix:hidden content
   - TypeScript might extract after preprocessing

### 8.2 Incorrect Patterns

1. **Section name normalization**
   - Might not handle all format variations: "Item 1", "1", "item 1", "ITEM 1"
   - Case sensitivity issues

2. **8-K item number normalization**
   - Might not handle Apple-style spacing: "Item 2. 02" → "2.02"

3. **Error handling**
   - Using generic try/catch instead of specific error types
   - Not logging at fallback points

4. **Memory efficiency**
   - Not using readonly fields or object freezing
   - Storing duplicate data

---

## 9. Implementation Checklist for TypeScript

### High Priority (Core Functionality)

- [ ] Implement lazy document parsing (parse on first access, not in constructor)
- [ ] Add confidence scores to Section interface
- [ ] Implement part-qualified section names for 10-Q (`part_i_item_1`, `part_ii_item_1`)
- [ ] Add multi-format section lookup in `__getitem__` / `get()` method
- [ ] Store original HTML before preprocessing for TOC detection
- [ ] Extract XBRL before preprocessing (to capture ix:hidden)
- [ ] Implement section boundary artifact cleaning
- [ ] Add detection_method tracking ('toc', 'heading', 'pattern')

### Medium Priority (Accuracy Improvements)

- [ ] Implement hybrid multi-strategy section detection
- [ ] Add TOC-based section detection (0.95 confidence)
- [ ] Add heading-based detection fallback (0.7-0.9 confidence)
- [ ] Implement validation pipeline (cross-validate, deduplicate, filter)
- [ ] Add Cross Reference Index fallback for GE-style filings
- [ ] Implement 8-K item normalization (handle "Item 2. 02" spacing)
- [ ] Add proper part/item parsing from section names

### Low Priority (Polish)

- [ ] Add deprecation warnings for legacy APIs
- [ ] Implement Sections dictionary wrapper with rich display
- [ ] Add get_item(item, part) method to Sections
- [ ] Implement streaming parser for large documents
- [ ] Add performance metrics tracking
- [ ] Implement UU-decode for binary SGML documents

---

## 10. Testing Recommendations

### Critical Test Cases

1. **10-Q Part Disambiguation**
   ```typescript
   const tenq = new TenQ(filing);
   assert(tenq['Part I, Item 1'] !== tenq['Part II, Item 1']);
   assert(tenq.sections.get_item('1', 'I') !== tenq.sections.get_item('1', 'II'));
   ```

2. **8-K Item Normalization**
   ```typescript
   assert(_normalize_item_number('Item 2. 02') === '2.02');
   assert(_normalize_item_number('ITEM 2.02') === '2.02');
   ```

3. **Section Name Variations**
   ```typescript
   const tenk = new TenK(filing);
   const section1 = tenk['Item 1'];
   const section2 = tenk['1'];
   const section3 = tenk['business'];
   assert(section1 === section2 && section2 === section3);
   ```

4. **Boundary Cleaning**
   ```typescript
   const text = section.text();
   assert(!text.match(/\d{1,3}\s*$/));  // No trailing page numbers
   assert(!text.match(/PART\s+[IVX]+\s*$/));  // No trailing part headers
   ```

5. **Lazy Evaluation**
   ```typescript
   const tenk = new TenK(filing);
   assert(!tenk._document);  // Not parsed yet
   const sections = tenk.sections;
   assert(tenk._document);  // Now parsed
   ```

---

## 11. File Reference Summary

| Component | File | Lines | Key Classes/Functions |
|-----------|------|-------|----------------------|
| TenK | `edgar/company_reports/ten_k.py` | 622 | TenK, __getitem__ (328-524) |
| TenQ | `edgar/company_reports/ten_q.py` | 409 | TenQ, __getitem__ (172-267) |
| EightK | `edgar/company_reports/current_report.py` | 1061 | EightK, _normalize_item_number |
| CompanyReport Base | `edgar/company_reports/_base.py` | 175 | CompanyReport |
| HTMLParser | `edgar/documents/parser.py` | 386 | HTMLParser.parse (80-175) |
| Document | `edgar/documents/document.py` | 1133 | Document, Section, Sections |
| SGMLParser | `edgar/sgml/sgml_parser.py` | 594 | SGMLParser, SGMLDocument |
| FilingSGML | `edgar/sgml/sgml_common.py` | 397 | FilingSGML |
| Hybrid Detector | `edgar/documents/extractors/hybrid_section_detector.py` | 200 | HybridSectionDetector |
| Pattern Extractor | `edgar/documents/extractors/pattern_section_extractor.py` | 300+ | SectionExtractor, SECTION_PATTERNS |
| Config | `edgar/documents/config.py` | 212 | ParserConfig, DetectionThresholds |

---

## Conclusion

The Python edgartools architecture is significantly more sophisticated than a basic parser. Key architectural principles:

1. **Multi-layered fallback** - Always have backup strategies
2. **Lazy evaluation** - Parse on demand, cache results
3. **Confidence tracking** - Every detection has a quality score
4. **Dual extraction** - TOC vs. node-based text extraction
5. **Part qualification** - 10-Q requires part-aware section names
6. **Format flexibility** - Support multiple naming conventions
7. **Boundary cleaning** - Remove page artifacts from section text
8. **Original preservation** - Store unmodified HTML for TOC analysis
9. **Form-based dispatch** - Different strategies for different filing types

**Most Critical for TypeScript Port**:
- Implement lazy document parsing
- Add part-qualified section names for 10-Q
- Preserve original HTML for TOC detection
- Extract XBRL before preprocessing
- Clean section boundary artifacts
- Support multiple section name formats in lookups

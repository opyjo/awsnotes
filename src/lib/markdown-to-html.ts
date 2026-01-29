/**
 * Converts markdown text to HTML format compatible with TipTap editor
 */
export const markdownToHtml = (markdown: string): string => {
  if (!markdown.trim()) return "";

  const lines = markdown.split("\n");
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLanguage = "";
  let inTable = false;
  let tableRows: string[] = [];

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const processInline = (text: string): string => {
    // Escape HTML first
    text = escapeHtml(text);
    // Bold **text**
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic *text* or _text_
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    text = text.replace(/_([^_]+)_/g, "<em>$1</em>");
    // Inline code `code` (needs to be after escaping)
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    return text;
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      result.push("<table><tbody>");
      result.push(...tableRows);
      result.push("</tbody></table>");
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : "";

    // Code blocks
    if (line.startsWith("```")) {
      flushTable();
      if (inCodeBlock) {
        const code = codeBlockContent.join("\n");
        result.push(`<pre><code class="language-${codeBlockLanguage}">${escapeHtml(code)}</code></pre>`);
        codeBlockContent = [];
        codeBlockLanguage = "";
        inCodeBlock = false;
      } else {
        codeBlockLanguage = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushTable();
      const level = headerMatch[1].length;
      const text = headerMatch[2];
      result.push(`<h${level}>${processInline(text)}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) {
      flushTable();
      result.push("<hr>");
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      flushTable();
      const quoteText = line.replace(/^>\s?/, "");
      result.push(`<blockquote>${processInline(quoteText)}</blockquote>`);
      continue;
    }

    // Table detection
    if (line.includes("|") && line.trim().startsWith("|")) {
      // Check if next line is a separator
      const isSeparator = /^\|[\s-:|]+\|?$/.test(nextLine);
      
      if (isSeparator) {
        // This is a header row
        flushTable();
        inTable = true;
        const cells = line.split("|").map(c => c.trim()).filter(c => c);
        if (cells.length > 0) {
          tableRows.push(`<tr>${cells.map(cell => `<th>${processInline(cell)}</th>`).join("")}</tr>`);
        }
        i++; // Skip separator line
        continue;
      } else if (inTable) {
        // This is a data row
        const cells = line.split("|").map(c => c.trim()).filter(c => c);
        if (cells.length > 0) {
          tableRows.push(`<tr>${cells.map(cell => `<td>${processInline(cell)}</td>`).join("")}</tr>`);
        }
        continue;
      }
    }

    // If we were in a table and this line doesn't have a pipe, flush the table
    if (inTable && !line.includes("|")) {
      flushTable();
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (ulMatch) {
      flushTable();
      const text = ulMatch[2];
      result.push(`<ul><li>${processInline(text)}</li></ul>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    if (olMatch) {
      flushTable();
      const text = olMatch[2];
      result.push(`<ol><li>${processInline(text)}</li></ol>`);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushTable();
      result.push("<p></p>");
      continue;
    }

    // Regular paragraph
    flushTable();
    result.push(`<p>${processInline(line)}</p>`);
  }

  // Close any open structures
  flushTable();
  
  if (inCodeBlock && codeBlockContent.length > 0) {
    const code = codeBlockContent.join("\n");
    result.push(`<pre><code class="language-${codeBlockLanguage}">${escapeHtml(code)}</code></pre>`);
  }

  // Clean up empty paragraphs and join
  return result.join("").replace(/<p><\/p>/g, "").replace(/<p>\s*<\/p>/g, "");
};

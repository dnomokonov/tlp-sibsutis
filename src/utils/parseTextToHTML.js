function applyInlineFormatting(text, steps) {
    let current = text;

    function applyRule(regex, replacement, rule, description) {
        const before = current;
        const after = current.replace(regex, replacement);
        if (after !== before) {
            steps.push({
                level: "inline",
                rule,
                description,
                before,
                after,
            });
            current = after;
        }
    }

    // сначала *** (bold+italic), затем **, затем *
    applyRule(
        /\*\*\*(.+?)\*\*\*/g,
        "<strong><em>$1</em></strong>",
        "bold-italic",
        "Замена ***текст*** на <strong><em>текст</em></strong>"
    );

    applyRule(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>",
        "bold",
        "Замена **текст** на <strong>текст</strong>"
    );

    applyRule(
        /\*(.+?)\*/g,
        "<em>$1</em>",
        "italic",
        "Замена *текст* на <em>текст</em>"
    );

    // Инлайновый код
    applyRule(
        /`(.+?)`/g,
        "<code>$1</code>",
        "code-inline",
        "Замена `код` на <code>код</code>"
    );

    return current;
}

function buildBlocks(source, steps, errors) {
    const lines = source.split(/\r?\n/);
    const blocks = [];

    let i = 0;
    let inCodeBlock = false;
    let codeBuffer = [];

    while (i < lines.length) {
        const line = lines[i];

        if (line.trim().startsWith("```")) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeBuffer = [];
                steps.push({
                    level: "block",
                    rule: "code-block-start",
                    description: "Начало блока кода ```",
                    line: i + 1,
                    content: line,
                });
            } else {
                inCodeBlock = false;
                const codeContent = codeBuffer.join("\n");
                blocks.push({ type: "code", content: codeContent });
                steps.push({
                    level: "block",
                    rule: "code-block-end",
                    description: "Конец блока кода ``` = <pre><code>...</code></pre>",
                    line: i + 1,
                    content: codeContent,
                });
                codeBuffer = [];
            }
            i += 1;
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);
            i += 1;
            continue;
        }

        // Пустая строка
        if (line.trim() === "") {
            i += 1;
            continue;
        }

        // Заголовки: # ... ######
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = headingMatch[2];
            blocks.push({ type: "heading", level, content });
            steps.push({
                level: "block",
                rule: "heading",
                description: `Распознан заголовок уровня ${level} = <h${level}>`,
                line: i + 1,
                content: line,
            });
            i += 1;
            continue;
        }

        // Blockquote: > text
        if (line.trim().startsWith(">")) {
            const quoteLines = [];
            let j = i;
            while (j < lines.length && lines[j].trim().startsWith(">")) {
                quoteLines.push(lines[j].replace(/^\s*>\s?/, ""));
                j += 1;
            }
            const content = quoteLines.join("\n");
            blocks.push({ type: "blockquote", content });
            steps.push({
                level: "block",
                rule: "blockquote",
                description: "Распознан блок цитаты = <blockquote>",
                line: i + 1,
                content,
            });
            i = j;
            continue;
        }

        // Ordered list: 1. item
        if (/^\s*\d+\.\s+/.test(line)) {
            const items = [];
            let j = i;
            while (j < lines.length && /^\s*\d+\.\s+/.test(lines[j])) {
                items.push(lines[j].replace(/^\s*\d+\.\s+/, ""));
                j += 1;
            }
            blocks.push({ type: "ordered-list", items });
            steps.push({
                level: "block",
                rule: "ordered-list",
                description: "Распознан нумерованный список = <ol><li>...</li></ol>",
                line: i + 1,
                content: items.join(" | "),
            });
            i = j;
            continue;
        }

        // Unordered list: - item / * item
        if (/^\s*([-*])\s+/.test(line)) {
            const items = [];
            let j = i;
            while (j < lines.length && /^\s*([-*])\s+/.test(lines[j])) {
                items.push(lines[j].replace(/^\s*([-*])\s+/, ""));
                j += 1;
            }
            blocks.push({ type: "unordered-list", items });
            steps.push({
                level: "block",
                rule: "unordered-list",
                description: "Распознан маркированный список = <ul><li>...</li></ul>",
                line: i + 1,
                content: items.join(" | "),
            });
            i = j;
            continue;
        }

        // Параграф
        const paraLines = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].trim() !== "") {
            const l = lines[j];

            if (
                l.trim().startsWith("#") ||
                l.trim().startsWith(">") ||
                /^\s*\d+\.\s+/.test(l) ||
                /^\s*([-*])\s+/.test(l) ||
                l.trim().startsWith("```")
            ) {
                break;
            }

            paraLines.push(l);
            j += 1;
        }

        const content = paraLines.join("\n");
        blocks.push({ type: "paragraph", content });
        steps.push({
            level: "block",
            rule: "paragraph",
            description: "Распознан абзац = <p>",
            line: i + 1,
            content,
        });
        i = j;
    }

    if (inCodeBlock) {
        errors.push({
            type: "syntax",
            message: "Незакрытый блок кода ```",
        });
    }

    return blocks;
}

function renderBlocksToHTML(blocks, steps) {
    const htmlParts = [];

    for (let index = 0; index < blocks.length; index++) {
        const block = blocks[index];

        if (block.type === "code") {
            const escaped = block.content
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            const html = `<pre><code>${escaped}</code></pre>`;
            htmlParts.push(html);
            steps.push({
                level: "render",
                rule: "code-block",
                description: "Рендер блока кода = <pre><code>",
                blockIndex: index,
                html,
            });
            continue;
        }

        if (block.type === "heading") {
            const inner = applyInlineFormatting(block.content, steps);
            const html = `<h${block.level}>${inner}</h${block.level}>`;
            htmlParts.push(html);
            steps.push({
                level: "render",
                rule: "heading",
                description: `Рендер заголовка уровня ${block.level}`,
                blockIndex: index,
                html,
            });
            continue;
        }

        if (block.type === "blockquote") {
            const inner = applyInlineFormatting(block.content, steps);
            const html = `<blockquote><p>${inner}</p></blockquote>`;
            htmlParts.push(html);
            steps.push({
                level: "render",
                rule: "blockquote",
                description: "Рендер цитаты = <blockquote><p>",
                blockIndex: index,
                html,
            });
            continue;
        }

        if (block.type === "ordered-list") {
            const itemsHtml = block.items
                .map((item) => `<li>${applyInlineFormatting(item, steps)}</li>`)
                .join("");
            const html = `<ol>${itemsHtml}</ol>`;
            htmlParts.push(html);
            steps.push({
                level: "render",
                rule: "ordered-list",
                description: "Рендер нумерованного списка = <ol><li>",
                blockIndex: index,
                html,
            });
            continue;
        }

        if (block.type === "unordered-list") {
            const itemsHtml = block.items
                .map((item) => `<li>${applyInlineFormatting(item, steps)}</li>`)
                .join("");
            const html = `<ul>${itemsHtml}</ul>`;
            htmlParts.push(html);
            steps.push({
                level: "render",
                rule: "unordered-list",
                description: "Рендер маркированного списка = <ul><li>",
                blockIndex: index,
                html,
            });
            continue;
        }

        if (block.type === "paragraph") {
            const inner = applyInlineFormatting(block.content, steps);
            const html = `<p>${inner}</p>`;
            htmlParts.push(html);
            steps.push({
                level: "render",
                rule: "paragraph",
                description: "Рендер абзаца = <p>",
                blockIndex: index,
                html,
            });
            continue;
        }
    }

    return htmlParts.join("\n");
}

export function parseTextToHTMLWithSteps(source) {
    const steps = [];
    const errors = [];

    steps.push({
        level: "info",
        rule: "input",
        description: "Исходный текст разметки",
        content: source,
    });

    const blocks = buildBlocks(source, steps, errors);
    const html = renderBlocksToHTML(blocks, steps);

    return { html, steps, errors };
}

export function parseTextToHTML(source) {
    return parseTextToHTMLWithSteps(source).html;
}

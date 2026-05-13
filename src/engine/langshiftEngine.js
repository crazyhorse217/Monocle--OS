class LangShiftEngine {
  handle({ sourceLanguage, targetLanguage, mode, input }) {
    if (mode === 'translate' &&
        sourceLanguage === 'Python' &&
        targetLanguage === 'C#') {
      return {
        output: this.pythonToCSharp(input),
        notes: 'Python → C# translation complete (advanced mode).'
      };
    }

    if (mode === 'translate' &&
        sourceLanguage === 'C#' &&
        targetLanguage === 'Python') {
      return {
        output: this.csharpToPython(input),
        notes: 'C# → Python translation complete.'
      };
    }

    if (mode === 'explain') {
      return {
        output: this.explainCode(sourceLanguage, input),
        notes: `Explanation for ${sourceLanguage} code.`
      };
    }

    return {
      output: '// Unsupported mode or language pair.',
      notes: 'Not implemented.'
    };
  }

  // ─── PYTHON → C# ────────────────────────────────────────────────────────────

  pythonToCSharp(code) {
    let lines = code.split('\n');
    let output = [];
    let indentStack = [];
    let usings = new Set();

    usings.add('System');
    usings.add('System.Collections.Generic');

    const indentSize = (line) => line.match(/^\s*/)[0].length;

    const openBlock = (indent) => {
      indentStack.push(indent);
      output.push('{');
    };

    const closeBlocks = (currentIndent) => {
      while (indentStack.length > 0 &&
             indentStack[indentStack.length - 1] >= currentIndent) {
        indentStack.pop();
        output.push('}');
      }
    };

    // Collect all body lines deeper than baseIndent, starting after startIdx
    const collectBodyLines = (startIdx, baseIndent) => {
      const body = [];
      for (let j = startIdx + 1; j < lines.length; j++) {
        const raw = lines[j];
        if (raw.trim() === '') continue;
        if (indentSize(raw) <= baseIndent) break;
        body.push(raw);
      }
      return body;
    };

    // --- IMPORTS → USING ---
    for (let line of lines) {
      if (line.trim().startsWith('import ')) {
        let mod = line.replace('import ', '').trim();
        let mapped = this.mapImport(mod);
        if (mapped) usings.add(mapped);
      }
    }

    for (let u of usings) output.push(`using ${u};`);
    output.push('');

    // --- MAIN TRANSLATION LOOP ---
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      let raw = lines[i];

      if (line === '' || line.startsWith('import ')) {
        continue;
      }

      let currentIndent = indentSize(raw);
      closeBlocks(currentIndent);

      // --- CLASS WITH INHERITANCE ---
      if (line.startsWith('class ')) {
        let match = line.match(/class\s+(\w+)(?:\((.*?)\))?/);
        if (match) {
          let name = match[1];
          let base = match[2] ? ` : ${match[2]}` : '';
          output.push(`public class ${name}${base}`);
          openBlock(currentIndent);
          continue;
        }
      }

      // --- ASYNC DEF ---
      if (line.startsWith('async def ')) {
        let match = line.match(/async def\s+(\w+)\((.*?)\):/);
        if (match) {
          let name = match[1];
          let args = this.mapArgs(match[2]);
          const body = collectBodyLines(i, currentIndent);
          const retType = this.mapReturnType(body);
          output.push(`public async Task<${retType}> ${name}(${args})`);
          openBlock(currentIndent);
          continue;
        }
      }

      // --- NORMAL DEF ---
      // before loop, collect function bodies by indent if you want to be precise;
      // for now, you can default to 'object' or 'void' and upgrade later.
      if (line.startsWith('def ')) {
        let match = line.match(/def\s+(\w+)\((.*?)\):/);
        if (match) {
          let name = match[1];
          let args = this.mapArgs(match[2]); // still object args for now
          const returnType = 'object';       // or call mapReturnType if you track body
          output.push(`public ${returnType} ${name}(${args})`);
          openBlock(currentIndent);
          continue;
        }
      }

      // --- IF / ELIF / ELSE ---
      if (line.startsWith('if ')) {
        let cond = line.replace('if ', '').replace(':', '');
        output.push(`if (${this.pyExpr(cond)})`);
        openBlock(currentIndent);
        continue;
      }

      if (line.startsWith('elif ')) {
        let cond = line.replace('elif ', '').replace(':', '');
        output.push(`else if (${this.pyExpr(cond)})`);
        openBlock(currentIndent);
        continue;
      }

      if (line.startsWith('else:')) {
        output.push(`else`);
        openBlock(currentIndent);
        continue;
      }

      // --- FOR LOOPS ---
      if (line.startsWith('for ')) {
        let match = line.match(/for\s+(\w+)\s+in\s+(.*):/);
        if (match) {
          let varName = match[1];
          let iterable = this.pyExpr(match[2]);
          output.push(`foreach (var ${varName} in ${iterable})`);
          openBlock(currentIndent);
          continue;
        }
      }

      // --- WHILE ---
      if (line.startsWith('while ')) {
        let cond = line.replace('while ', '').replace(':', '');
        output.push(`while (${this.pyExpr(cond)})`);
        openBlock(currentIndent);
        continue;
      }

      // --- RETURN ---
      if (line.startsWith('return ')) {
        output.push(`return ${this.pyExpr(line.replace('return ', ''))};`);
        continue;
      }

      // --- TYPED ASSIGNMENT ---
      if (line.includes(' = ')) {
        let [left, right] = line.split('=').map(s => s.trim());
        const mapped = this.mapValue(right);
        const type = mapped.type === 'var' ? 'var' : mapped.type;
        output.push(`${type} ${left} = ${mapped.value};`);
        continue;
      }

      // --- FALLBACK ---
      output.push(this.pyExpr(line) + ';');
    }

    closeBlocks(0);
    return output.join('\n');
  }

  // ─── C# → PYTHON ────────────────────────────────────────────────────────────

  csharpToPython(code) {
    const lines = code.split('\n');
    const output = [];
    let indentLevel = 0;

    const pad = () => '    '.repeat(indentLevel);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      if (line === '') { output.push(''); continue; }

      // Skip using statements
      if (line.startsWith('using ')) continue;

      // Standalone opening brace
      if (line === '{') { indentLevel++; continue; }

      // Standalone closing brace
      if (line === '}' || line === '};') {
        indentLevel = Math.max(0, indentLevel - 1);
        continue;
      }

      // Strip inline trailing { so patterns match cleanly
      const inlineBlock = line.endsWith('{');
      const stripped = inlineBlock ? line.slice(0, -1).trim() : line;

      // --- CLASS WITH OPTIONAL INHERITANCE ---
      const classMatch = stripped.match(
        /^(?:public|private|protected|internal|static|\s)*class\s+(\w+)(?:\s*:\s*(\w+))?/
      );
      if (classMatch) {
        const name = classMatch[1];
        const base = classMatch[2] ? `(${classMatch[2]})` : '';
        output.push(`${pad()}class ${name}${base}:`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      // --- ASYNC METHOD ---
      const asyncMatch = stripped.match(
        /^(?:public|private|protected)?\s*async\s+Task(?:<[^>]+>)?\s+(\w+)\((.*?)\)/
      );
      if (asyncMatch) {
        const name = asyncMatch[1];
        const args = this.csharpArgsToP(asyncMatch[2]);
        output.push(`${pad()}async def ${name}(${args}):`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      // --- TYPED FIELD: public/private/protected TYPE name = value; ---
      // int x = 5;
      if (/^(public|private|protected)\s+[\w<>\[\]]+\s+\w+\s*=/.test(line)) {
        const m = line.match(/^(?:public|private|protected)\s+([\w<>\[\]]+)\s+(\w+)\s*=\s*(.*);$/);
        if (m) {
          const name = m[2];
          const value = m[3];
          output.push(`${pad()}${name} = ${this.csExprToPy(value)}`);
          continue;
        }
      }

      // --- AUTO-PROPERTY → comment for now ---
      if (/^(public|private|protected)\s+[\w<>\[\]]+\s+\w+\s*\{\s*get;\s*set;\s*\}/.test(line)) {
        output.push(`${pad()}# property: ${line}`);
        continue;
      }

      // --- NORMAL METHOD ---
      const methodMatch = stripped.match(
        /^(?:public|private|protected)?\s*(?:static\s+)?[\w<>\[\]]+\s+(\w+)\((.*?)\)$/
      );
      if (methodMatch && !['if', 'while', 'for', 'foreach'].includes(methodMatch[1])) {
        const name = methodMatch[1];
        const args = this.csharpArgsToP(methodMatch[2]);
        output.push(`${pad()}def ${name}(${args}):`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      // --- RETURN ---
      if (line.startsWith('return ')) {
        const expr = line.replace(/^return\s+/, '').replace(/;$/, '');
        output.push(`${pad()}return ${this.csExprToPy(expr)}`);
        continue;
      }

      // --- IF / ELSE IF / ELSE ---
      const ifMatch = stripped.match(/^if\s*\((.*)\)$/);
      if (ifMatch) {
        output.push(`${pad()}if ${this.csExprToPy(ifMatch[1])}:`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      const elseIfMatch = stripped.match(/^else\s+if\s*\((.*)\)$/);
      if (elseIfMatch) {
        output.push(`${pad()}elif ${this.csExprToPy(elseIfMatch[1])}:`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      if (stripped === 'else') {
        output.push(`${pad()}else:`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      // --- FOREACH ---
      const foreachMatch = stripped.match(
        /^foreach\s*\(\s*(?:var|[\w<>]+)\s+(\w+)\s+in\s+(.*)\)$/
      );
      if (foreachMatch) {
        output.push(`${pad()}for ${foreachMatch[1]} in ${this.csExprToPy(foreachMatch[2])}:`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      // --- WHILE ---
      const whileMatch = stripped.match(/^while\s*\((.*)\)$/);
      if (whileMatch) {
        output.push(`${pad()}while ${this.csExprToPy(whileMatch[1])}:`);
        if (inlineBlock) indentLevel++;
        continue;
      }

      // --- LOCAL VAR ---
      const varMatch = line.match(
        /^(?:var|int|double|float|long|string|bool|object)\s+(\w+)\s*=\s*(.*);$/
      );
      if (varMatch) {
        output.push(`${pad()}${varMatch[1]} = ${this.csExprToPy(varMatch[2])}`);
        continue;
      }

      // --- FALLBACK ---
      output.push(`${pad()}# ${line}`);
    }

    return output.join('\n');
  }

  // ─── SHARED HELPERS ──────────────────────────────────────────────────────────

  // --- TYPED VALUE INFERENCE ---
  mapValue(v) {
    const trimmed = v.trim();

    if (/^-?\d+$/.test(trimmed)) return { type: 'int', value: trimmed };

    if (/^-?\d+\.\d+$/.test(trimmed)) return { type: 'double', value: trimmed };

    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return { type: 'string', value: trimmed };
    }

    if (trimmed === 'True' || trimmed === 'False') {
      return { type: 'bool', value: trimmed === 'True' ? 'true' : 'false' };
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return { type: 'List<object>', value: `new List<object> ${trimmed}` };
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return {
        type: 'Dictionary<object, object>',
        value: `new Dictionary<object, object> ${trimmed}`
      };
    }

    return { type: 'var', value: this.pyExpr(trimmed) };
  }

  // --- RETURN TYPE INFERENCE FROM BODY ---
  mapReturnType(bodyLines) {
    const returns = bodyLines.filter(l => l.trim().startsWith('return '));
    if (!returns.length) return 'void';

    const expr = returns[0].trim().replace(/^return\s+/, '');
    const { type } = this.mapValue(expr);
    if (type === 'var') return 'object';
    if (type === 'List<object>') return 'List<object>';
    if (type === 'Dictionary<object, object>') return 'Dictionary<object, object>';
    return type;
  }

  // --- PYTHON ARGUMENT MAPPING → C# ---
  mapArgs(argStr) {
    if (!argStr.trim()) return '';
    return argStr
      .split(',')
      .map(a => a.trim())
      .map(a => `object ${a}`)
      .join(', ');
  }

  // --- C# ARGUMENT MAPPING → PYTHON ---
  csharpArgsToP(argStr) {
    if (!argStr.trim()) return 'self';
    const args = argStr.split(',').map(a => {
      const parts = a.trim().split(/\s+/);
      return parts[parts.length - 1];
    });
    return ['self', ...args].join(', ');
  }

  // --- IMPORT → USING ---
  mapImport(mod) {
    const map = {
      'math': 'System',
      'random': 'System',
      'datetime': 'System',
      'json': 'System.Text.Json'
    };
    return map[mod] || null;
  }

  // --- PYTHON → C# EXPRESSIONS ---
  pyExpr(expr) {
    return expr
      .replace(/True/g, 'true')
      .replace(/False/g, 'false')
      .replace(/None/g, 'null')
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\s+/g, '!')
      .replace(/await\s+/g, 'await ');
  }

  // --- C# → PYTHON EXPRESSIONS ---
  csExprToPy(expr) {
    return expr
      .replace(/\btrue\b/g, 'True')
      .replace(/\bfalse\b/g, 'False')
      .replace(/\bnull\b/g, 'None')
      .replace(/&&/g, 'and')
      .replace(/\|\|/g, 'or')
      .replace(/!(?!=)/g, 'not ')
      .replace(/new List<[^>]+>\s*\{([^}]*)\}/g, '[$1]')
      .replace(/new Dictionary<[^>]+>\s*\{([^}]*)\}/g, '{$1}')
      .replace(/;$/, '');
  }

  explainCode(lang, code) {
    return code
      .split('\n')
      .map(l => `// ${l}`)
      .join('\n');
  }
}

window.LangShiftEngine = LangShiftEngine;

export default LangShiftEngine;

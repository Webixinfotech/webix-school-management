const fs = require('fs');
const content = fs.readFileSync('attendance_api_postman_collection.json', 'utf8');

function findMismatches() {
  let inString = false;
  let escapeNext = false;
  let lineNum = 1;
  let colNum = 1;
  let stack = []; // track braces/brackets
  let lastChar = '';

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (escapeNext) {
      escapeNext = false;
      colNum++;
      continue;
    }

    if (ch === '\\' && inString) {
      escapeNext = true;
      lastChar = ch;
      colNum++;
      continue;
    }

    if (ch === '"' && !inString) {
      inString = true;
    } else if (ch === '"' && inString) {
      inString = false;
    }

    if (!inString) {
      if (ch === '{' || ch === '[') stack.push({char: ch, line: lineNum, col: colNum});
      else if (ch === '}') {
        const last = stack.pop();
        if (last && last.char !== '{') {
          console.log(`Mismatch: } at ${lineNum}:${colNum} expected closing for ${last.char} opened at ${last.line}:${last.col}`);
        }
      } else if (ch === ']') {
        const last = stack.pop();
        if (last && last.char !== '[') {
          console.log(`Mismatch: ] at ${lineNum}:${colNum} expected closing for ${last.char} opened at ${last.line}:${last.col}`);
        }
      }

      if (ch === ',' || ch === '{' || ch === '[' || ch === '}' || ch === ']') {
        lastChar = ch;
      }
    }

    if (ch === '\n') {
      lineNum++;
      colNum = 1;
    } else {
      colNum++;
    }
  }

  if (stack.length) console.log('Unclosed:', stack);
  else console.log('Braces/brackets balanced');
}

findMismatches();

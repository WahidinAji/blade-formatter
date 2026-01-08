const bf = require('blade-formatter');

const tests = [
  { name: 'Simple PHP code', input: `@php\n$var = 1;\n@endphp` },
  { name: 'Nested PHP code', input: `@php\n$var = function() {\n  $test = 1;\n};\n@endphp` },
  { name: 'Deeply nested PHP', input: `@php\nif ($test) {\n  if ($nested) {\n    $deep = 1;\n  }\n}\n@endphp` },
  { name: 'Array in PHP', input: `@php\n$arr = [\n  'key' => 'value'\n];\n@endphp` },
];

async function testAll() {
  for (const test of tests) {
    const f = new bf.BladeFormatter({indentSize: 2});
    const output = await f.format(test.input);
    console.log(`\n--- ${test.name} ---`);
    console.log(output);
  }
}

testAll();

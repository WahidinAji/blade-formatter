const bf = require('blade-formatter');

const input = `@php
$var = function() {
  $test = 1;
};
@endphp`;

async function testWithDifferentSizes() {
  for (const size of [2, 4, 8]) {
    const f = new bf.BladeFormatter({indentSize: size});
    const output = await f.format(input);
    console.log(`\n--- indentSize: ${size} ---`);
    console.log(output);
  }
}

testWithDifferentSizes();

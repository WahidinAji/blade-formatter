const bf = require('blade-formatter');

const input = `@php
$var = function() {
  $test = 1;
};
@endphp`;

async function test() {
  const f = new bf.BladeFormatter({indentSize: 1});
  const output = await f.format(input);
  console.log('With indentSize: 1');
  console.log(output);
}

test();

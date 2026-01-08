const bf = require('blade-formatter');
const fs = require('fs');

const input = `
@php
    $test = function() {
        echo "hello";
    };
@endphp
`;

async function test() {
  const f = new bf.BladeFormatter({});
  const output1 = await f.format(input);
  console.log('With defaults:');
  console.log(output1);

  const f2 = new bf.BladeFormatter({indentSize: 2});
  const output2 = await f2.format(input);
  console.log('\nWith indentSize 2:');
  console.log(output2);
}

test();

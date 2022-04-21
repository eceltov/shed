const { add, del, newline, remline } = require('../lib/subdifOps');
const { testIndepDepArray } = require('./primTestingLib');

const tests = [
  [
    'Making a dif [add, add, add] independant and then dependant is an identity 1.',
    [add(0, 0, 'a'), add(0, 1, 'bc'), add(0, 3, 'defg')],
  ],
  [
    'Making a dif [add, add, add] independant and then dependant is an identity 2.',
    [add(0, 0, 'a'), add(0, 0, 'bc'), add(0, 0, 'defg')],
  ],
  [
    'Making a dif [add, add, add] independant and then dependant is an identity 3.',
    [add(0, 0, 'a'), add(0, 0, 'bc'), add(0, 1, 'defg')],
  ],
  [
    'Making a dif [add, del, add, del] independant and then dependant is an identity 1.',
    [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 2, 'ef'), del(0, 1, 2)],
  ],
  [
    'Making a dif [add, del, add, del] independant and then dependant is an identity 2.',
    [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 1, 'bc'), del(0, 0, 4)],
  ],
  [
    'Making a dif [add, del, add, del] independant and then dependant is an identity 3.',
    [add(0, 0, 'abcd'), del(0, 0, 4), add(0, 0, 'abcd'), del(0, 0, 4)],
  ],
  [
    'Making a dif [add, del, add, del] independant and then dependant is an identity 4.',
    [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 0, 'abcd'), del(0, 1, 4)],
  ],
  [
    'Making a dif [newline, add] independant and then dependant is an identity 1.',
    [newline(0, 0), add(0, 0, 'a')],
  ],
  [
    'Making a dif [newline, add] independant and then dependant is an identity 2.',
    [newline(1, 1), add(2, 1, 'a')],
  ],
  [
    'Making a dif [newline, add] independant and then dependant is an identity 3.',
    [newline(1, 0), add(0, 0, 'a')],
  ],
  [
    'Making a dif [add, newline] independant and then dependant is an identity 1.',
    [add(0, 0, 'a'), newline(0, 0)],
  ],
  [
    'Making a dif [add, newline] independant and then dependant is an identity 2.',
    [add(0, 0, 'ab'), newline(0, 0)],
  ],
  [
    'Making a dif [add, newline] independant and then dependant is an identity 3.',
    [add(0, 0, 'ab'), newline(0, 1)],
  ],
  [
    'Making a dif [add, newline] independant and then dependant is an identity 4.',
    [add(0, 0, 'ab'), newline(0, 2)],
  ],
  [
    'Making a dif [add, newline] independant and then dependant is an identity 5.',
    [add(0, 0, 'ab'), newline(0, 3)],
  ],
  [
    'Making a dif [add, newline] independant and then dependant is an identity 6.',
    [add(1, 0, 'a'), newline(0, 0)],
  ],
  [
    'Making a dif [newline, del] independant and then dependant is an identity 1.',
    [newline(0, 0), del(1, 1, 1)],
  ],
  [
    'Making a dif [newline, del] independant and then dependant is an identity 2.',
    [newline(2, 0), del(1, 1, 1)],
  ],
  [
    'Making a dif [newline, newline, newline] independant and then dependant is an identity 1.',
    [newline(0, 0), newline(0, 0), newline(0, 0)],
  ],
  [
    'Making a dif [newline, newline, newline] independant and then dependant is an identity 2.',
    [newline(0, 0), newline(1, 0), newline(2, 0)],
  ],
  [
    'Making a dif [newline, newline, newline] independant and then dependant is an identity 3.',
    [newline(2, 0), newline(1, 0), newline(0, 0)],
  ],
  [
    'Making a dif [newline, newline, newline] independant and then dependant is an identity 4.',
    [newline(1, 0), newline(1, 0), newline(0, 0)],
  ],
  [
    'Making a dif [newline, newline, newline] independant and then dependant is an identity 5.',
    [newline(2, 0), newline(1, 0), newline(2, 0)], 
  ],
  [
    'Making a dif [newline, newline, newline] independant and then dependant is an identity 6.',
    [newline(1, 0), newline(2, 0), newline(1, 0)],
  ],
  [
    'Making a dif [newline, newline, newline] independant and then dependant is an identity 7.',
    [newline(2, 0), newline(2, 0), newline(0, 0)],
  ],
];

testIndepDepArray(tests);

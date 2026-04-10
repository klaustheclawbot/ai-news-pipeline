#!/usr/bin/env node
const { getAINews } = require('../src');

getAINews()
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

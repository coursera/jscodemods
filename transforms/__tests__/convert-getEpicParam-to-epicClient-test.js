'use strict';

const defineTest = require('jscodeshift/dist/testUtils').defineTest;
defineTest(__dirname, 'convert-getEpicParam-to-epicClient');
defineTest(__dirname, 'convert-getEpicParam-to-epicClient', null, 'convert-getEpicParam-to-epicClient2');

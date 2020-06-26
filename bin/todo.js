#!/usr/bin/env node

const cdk = require('@aws-cdk/core');
const { TodoStack } = require('../lib/todo-stack');

const app = new cdk.App();
new TodoStack(app, 'TodoStack');

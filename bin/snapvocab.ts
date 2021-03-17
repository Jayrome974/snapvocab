#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SnapvocabStack } from '../lib/snapvocab-stack';

const app = new cdk.App();
new SnapvocabStack(app, 'SnapvocabStack', {
  env: {
    account: app.node.tryGetContext("account"),
    region: app.node.tryGetContext("region"),
  },
  domainName: "snapvocab.com",
  gatewayDomainName: "bkfiqwa7w0.execute-api.ca-central-1.amazonaws.com"
});

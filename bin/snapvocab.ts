#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SnapvocabStack } from '../lib/snapvocab-stack';

const app = new cdk.App();
new SnapvocabStack(app, 'SnapvocabStack');

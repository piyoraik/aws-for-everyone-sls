#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsForEveryoneSlsStack } from '../lib/aws-for-everyone-sls-stack';

const app = new cdk.App();
new AwsForEveryoneSlsStack(app, 'AwsForEveryoneSlsStack');

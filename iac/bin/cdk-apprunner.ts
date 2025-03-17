#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApprunnerStack } from '../lib/apprunner-stack';
import { VpcStack } from '../lib/vpc-stack';
import { EcrStack } from '../lib/ecr-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = new cdk.App();

const ecrStack = new EcrStack(app, 'EcrStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION
    }
});

const vpcStack = new VpcStack(app, 'VpcStack', {
    env: {
        account: process.env.ACCOUNT_ID,
        region: process.env.REGION
    }
});

new ApprunnerStack(app, 'CdkApprunnerStack', {
    vpc: vpcStack.vpc,
    dbSecurityGroup: vpcStack.dbSecurityGroup,
    rdsInstance: vpcStack.rdsInstance,
    repository: ecrStack.repository,
    env: {
        account: process.env.ACCOUNT_ID,
        region: process.env.REGION
    }
}).addDependency(vpcStack);
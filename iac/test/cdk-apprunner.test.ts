import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as CdkApprunner from '../lib/apprunner-stack';
import { getConfig } from '../lib/config';

describe('RdsResourceStack', () => {
    let template: Template;
    let stack: CdkApprunner.CdkApprunnerStack;

    beforeAll(() => {
        const app = new cdk.App();
        stack = new CdkApprunner.CdkApprunnerStack(app, 'RdsResourceStack', {
            env: {
                account: getConfig().ACCOUNT,
                region: getConfig().REGION,
            },
        });

        template = Template.fromStack(stack);
    });



});

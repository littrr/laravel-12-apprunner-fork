import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as Apprunner from '../lib/apprunner-stack';

/* describe('ApprunnerStack', () => {
    let template: Template;
    let stack: Apprunner.ApprunnerStack;

    beforeAll(() => {
        const app = new cdk.App();
        stack = new Apprunner.ApprunnerStack(app, 'ApprunnerStack', {
            env: {
                account: process.env.ACCOUNT_ID,
                region: process.env.REGION,
            },
        });

        template = Template.fromStack(stack);
    });
}); */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
    readonly repository: ecr.Repository;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this.repository = this.provisionEcrRepo();

        new cdk.CfnOutput(this, 'RepositoryNameOutput', {
            value: this.repository.repositoryName,
            description: 'ECR Repository Name',
        });
    }

    private provisionEcrRepo() {
        return new ecr.Repository(this, `${String(process.env.ECR_REPOSITORY_NAME)}`, {
            imageScanOnPush: Boolean(process.env.ECR_SCAN_IMAGE_ON_PUSH),
            removalPolicy: cdk.RemovalPolicy.DESTROY, // or cdk.RemovalPolicy.RETAIN (option)
        });
    }
}

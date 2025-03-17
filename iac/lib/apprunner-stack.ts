import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as apprunner from "aws-cdk-lib/aws-apprunner";

export interface ApprunnerStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
  rdsInstance: rds.DatabaseInstance;
  repository: ecr.Repository;
}

export class ApprunnerStack extends cdk.Stack {
  readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: ApprunnerStackProps) {
    super(scope, id, props);

    const appRunnerECRRole = this.provisionAppRunnerECRRole(props.repository);
    const appRunnerInstanceRole = this.provisionAppRunnerInstanceRole(props.rdsInstance);
    const vpcConnector = this.provisionVpcConnector(props.vpc);
    const appRunnerService = this.provisionAppRunnerService(appRunnerECRRole, appRunnerInstanceRole, vpcConnector, props.repository);

    // Apprunner service output
    new cdk.CfnOutput(this, "serviceUrl", {
      value: appRunnerService.attrServiceUrl,
      exportName: "serviceUrl",
    });
  }

  private provisionAppRunnerECRRole(repository: ecr.Repository) {
    const ecrRole = new iam.Role(this, `${this.stackName}-apprunner-ecr-role`, {
      assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
      description: `${this.stackName}-apprunner-ecr-role`,
    });

    ecrRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ecr:GetAuthorizationToken"],
      resources: ["*"],
    }));

    ecrRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:GetLifecyclePolicy",
        "ecr:GetLifecyclePolicyPreview",
        "ecr:ListTagsForResource",
        "ecr:DescribeImageScanFindings",
      ],
      resources: ["*"],
    }));

    return ecrRole;
  }

  private provisionAppRunnerInstanceRole(rdsInstance: rds.DatabaseInstance) {
    const instanceRole = new iam.Role(this, `${this.stackName}-apprunner-instance-role`, {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      description: `${this.stackName}-apprunner-instance-role`,
    });

    rdsInstance.secret?.encryptionKey?.grantDecrypt(instanceRole);
    rdsInstance.secret?.grantRead(instanceRole);

    return instanceRole;
  }

  private provisionVpcConnector(vpc: ec2.Vpc) {

    const vpcResourceSG = new ec2.SecurityGroup(this, `${this.stackName}-vpc-connector-sg`, {
        vpc,
        allowAllOutbound: true,
        description: "Ingress for all traffic",
    });
    vpcResourceSG.addIngressRule(
        ec2.Peer.ipv4(vpc.vpcCidrBlock),
        ec2.Port.allTraffic(),
    );
    
    return new apprunner.CfnVpcConnector(this, "vpcConnector", {
      subnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
      securityGroups: [vpcResourceSG.securityGroupId],
    });
  }

  private provisionAppRunnerService(appRunnerECRRole: iam.Role, appRunnerInstanceRole: iam.Role, vpcConnector: apprunner.CfnVpcConnector, repository: ecr.Repository) {
    return new apprunner.CfnService(this, `${this.stackName}-apprunner-service`, {
      serviceName: process.env.APPRUNNER_SERVICE_NAME,
      sourceConfiguration: {
        authenticationConfiguration: {
          accessRoleArn: appRunnerECRRole.roleArn,
        },
        autoDeploymentsEnabled: true,
        imageRepository: {
          imageIdentifier: `${process.env.ACCOUNT_ID}.dkr.ecr.${process.env.REGION}.amazonaws.com/${repository.repositoryName}:latest`,
          imageRepositoryType: "ECR",
          imageConfiguration: {
            port: process.env.APPRUNNER_IMAGE_PORT,
          },
        },
      },
      instanceConfiguration: {
        cpu: process.env.APPRUNNER_INSTANCE_CPU,
        memory: process.env.APPRUNNER_INSTANCE_MEMORY,
        instanceRoleArn: appRunnerInstanceRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: "TCP",
        timeout: process.env.APPRUNNER_HEALTH_CHECK_TIMEOUT ? parseInt(process.env.APPRUNNER_HEALTH_CHECK_TIMEOUT) : 2,
        interval: process.env.APPRUNNER_HEALTH_CHECK_INTERVAL ? parseInt(process.env.APPRUNNER_HEALTH_CHECK_INTERVAL) : 5,
        unhealthyThreshold: process.env.APPRUNNER_HEALTH_CHECK_UNHEALTHY_THRESHOLD ? parseInt(process.env.APPRUNNER_HEALTH_CHECK_UNHEALTHY_THRESHOLD) : 5,
        healthyThreshold: process.env.APPRUNNER_HEALTH_CHECK_HEALTHY_THRESHOLD ? parseInt(process.env.APPRUNNER_HEALTH_CHECK_HEALTHY_THRESHOLD) : 1,
      },
      networkConfiguration: {
        egressConfiguration: {
          egressType: "VPC",
          vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
        },
      },
    });
  }
}

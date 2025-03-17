import * as cdk from 'aws-cdk-lib';
import { Capture, Match, Template } from 'aws-cdk-lib/assertions';
import * as RdsResource from '../lib/vpc-stack';
import { getConfig } from '../lib/config';

describe('RdsResourceStack', () => {
    let template: Template;
    let stack: RdsResource.RdsResourceStack;

    beforeAll(() => {
        const app = new cdk.App();
        stack = new RdsResource.RdsResourceStack(app, 'RdsResourceStack', {
            env: {
                account: getConfig().ACCOUNT,
                region: getConfig().REGION,
            },
        });

        template = Template.fromStack(stack);
    });

    test('can provision a vpc', () => {
        template.hasResourceProperties('AWS::EC2::VPC', {
            CidrBlock: '10.0.0.0/16',
            EnableDnsSupport: true,
            EnableDnsHostnames: true,
        });

        // 3 public, 3 private with egress, 3 private isolated = 9 subnets
        template.resourceCountIs('AWS::EC2::Subnet', 9);
        
        template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('db instance security group is created', () => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup',
            Match.objectEquals({
                GroupDescription: "Ingress for MySQL Server",
                SecurityGroupEgress: [
                    {
                        CidrIp: "0.0.0.0/0",
                        Description: "Allow all outbound traffic by default",
                        IpProtocol: "-1"
                    },
                ],
                SecurityGroupIngress: [
                    {
                        CidrIp: {
                            "Fn::GetAtt": [
                                Match.stringLikeRegexp("RdsResourceStackvpc"),
                                "CidrBlock"
                            ]
                        },
                        Description: {
                            "Fn::Join": [
                                "",
                                [
                                    "from ",
                                    {
                                        "Fn::GetAtt": [
                                            Match.stringLikeRegexp("RdsResourceStackvpc"),
                                            "CidrBlock"
                                        ]
                                    },
                                    ":3306"
                                ]
                            ]
                        },
                        FromPort: 3306,
                        IpProtocol: "tcp",
                        ToPort: 3306
                    }
                ],
                VpcId: {
                    Ref: Match.stringLikeRegexp("RdsResourceStackvpc")
                }
            })
        );
    });

    test('can create db private subnet group', () => {
        const propertiesCapture = new Capture();

        template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
            Properties: propertiesCapture
        });

        expect(propertiesCapture.asArray()).toEqual([{
            DBSubnetGroupDescription: "Subnet group for RdsResourceStack-mysql-rds database",
            SubnetIds: [
                {
                    Ref: Match.stringLikeRegexp("RdsResourceStackvpcPrivateIsolated"),
                },
                {
                    Ref: Match.stringLikeRegexp("RdsResourceStackvpcPrivateIsolated"),
                },
                {
                    Ref: Match.stringLikeRegexp("RdsResourceStackvpcPrivateIsolated"),
                }
            ]
        }]);
    });

    test.only('can provision an rds instance', () => {
        const propertiesCapture = new Capture();

        template.hasResourceProperties('AWS::RDS::DBInstance', {
            Properties: propertiesCapture,
        });

        expect(propertiesCapture.asArray()).toEqual(
            [
                {
                    AllocatedStorage: "100",
                    AllowMajorVersionUpgrade: false,
                    AutoMinorVersionUpgrade: false,
                    BackupRetentionPeriod: 5,
                    CopyTagsToSnapshot: true,
                    DBInstanceClass: "db.t3.micro",
                    DBName: "l_12_apprunner",
                    DBSubnetGroupName: {
                        Ref: Match.stringLikeRegexp("RdsResourceStackmysqlrds"),
                    },
                    Engine: "mysql",
                    EngineVersion: "8.0",
                    MasterUserPassword: {
                        "Fn::Join": [
                            "",
                            [
                                "{{resolve:secretsmanager:",
                                    {
                                        Ref: Match.stringLikeRegexp("RdsResourceStackRdsResourceStackmysqlrds"),
                                    },
                                ":SecretString:password::}}"
                            ]
                        ]
                    },
                    MasterUsername: "cdkapprunner",
                    MultiAZ: false,
                    PubliclyAccessible: false,
                    StorageEncrypted: true,
                    StorageType: "gp2",
                    VPCSecurityGroups: [
                        {
                            "Fn::GetAtt": [
                                Match.stringLikeRegexp("RdsResourceStackrdssg"),
                                "GroupId"
                            ]
                        }
                    ],
                }
            ]
        )
    });

    test('will create a secret in secret manager to store rds credentials', () => {
        template.resourceCountIs("AWS::SecretsManager::Secret", 1);

        template.hasResourceProperties("AWS::SecretsManager::Secret", {
            Name: "rds/dev/cdkapprunner/mysql"
        });
    });
});

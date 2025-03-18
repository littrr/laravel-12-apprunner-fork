Laravel running on AWS App Runner
==========================================

A production-level Laravel application running on AWS App Runner.

AWS App Runner is a service that allows your to build and deploy web applications without managing infrastructure. It scales your application to meet changes in traffic demand, load balances your traffic to ensure optimum performance for your application.

AWS App Runner builds and deploys applications automatically. This is true but that is half the story.

You still need to provision your infrastructure, like specify the CPU and memory allocations. If you're using containers, you need to build your application's image and upload to AWS Elastic Container Registry.

For production, you need to provision your App Runner service in a VPC and provision a VPC Connector for App Runner to connect to other private VPC resources. For your App Runner service to connect to the public internet, you need to provision a NAT Gateway.

These are related tasks you need to perform to make App Runner run your Laravel application. This is where this repository comes in to take those burden out of your shoulders.

This repository provides an Infrastructure-As-Code solution for your Laravel application to run on AWS App Runner. It handles all the App Runner related configuration so you can focus on building your application.

It also provides CI/CD solution to make deployments effortless.

## Quickstart
- Fork this repository.
- Clone your forked repository.
- Set your AWS Access Key ID, AWS Secret Access Key, AWS Account ID, and AWS Region as GitHub repository secrets.
- Follow these steps to setup the repository secrets; AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ACCOUNT_ID and AWS_REGION.
    - Navigate to your repository's settings.
    - Under "Security", select "Secrets and variables".
    - Click "Actions" to navigate to the Actions secrets and variables page.
    - Select the "Secrets" tab, and click on "New repository secrets".

- Update the "APPRUNNER_SERVICE_NAME" field in the "iac/.env.example" file to your desired name.
- Commit and push your changes.
- This will trigger the CI/CD pipeline to:
    - Run the application tests.
    - Set up a repository in AWS Elastic Container Registry.
    - Build and upload the application's docker image to ECR.
    - Provision RDS and save RDS credentials in AWS Secret Manager.
    - Provision App Runner to pull your applications's docker image and run the application.


## Deep Dive
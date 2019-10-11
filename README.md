# Amazon EMR Customized  Scaling

You can use the Auto Scaling feature for most EMR scaling cases. However, it does not fit for all. For example, 
you have a batch job to run every day in the morning, and the job need to be finished within a certain time.
Thus, you need to scale out the EMR cluster and make sure it is ready before submit the job. 

This article describes a solution to scale out the EMR before submit the EMR task and scale in to save cost after
the task being terminated.

## Architecture

The following is the proposed architecture. Normally, it will take 3~4 minutes until the EMR cluster status becomes
ready.

![](assets/arch-1.jpg)

First the CloudWatch triggers a lambda function at a certain time like a cron job. The Lambda invoke the EMR API
to scale out the cluster, it will invoke API to check the EMR status repeatedly. Once the EMR enter *ready* status,
the Lambda function submit a EMR step. If the EMR cannot reach ready status, the Lambda function will send alarms
to the operation team through SNS. When the EMR task is finished, it should invoke another Lambda function to scale 
in the cluster.

In this proposal, we can there are enough compute capability before submitting the EMR task, while still keep the
cost as low as possible.

This solution can be automatically provisioned by [Serverless Framework](https://serverless.com). Refer to its 
getting started guide for the installation and configuration. 

## Prerequisites (For Serverless Framework)

1. AWS CLI

1. AWS Credentials (Access Key Id and Access Key Secret) has been configured.

1. Node.js 6 or higher version.

## Getting Started

1. Install [Serverless Framework CLI](https://serverless.com).
    ```shell
    npm install serverless -g
    ```
1. Clone this repo and change directory the root folder

1. Create a json file named `config.ENV.json`, where `ENV` is the name of your stage. Here you can find a 
sample file [`config.dev.json`](config.dev.json). 

1. Change the parameters in `config.ENV.json` to your custom parameters.

1. In **serverless.yml**, find `cron(0 19 * * ? *)`. This is for CloudWatch Event to trigger the Lambda regularly. 
You can change it to you custom Lambda trigger time.

1. In `emr.js`, change the line `const config = require('./config.dev.json');` to load the correct configuration file.

1. In `emr.js`, Insert code in **TODO** part to add a step to your EMR
through [API](https://docs.aws.amazon.com/emr/latest/APIReference/API_AddJobFlowSteps.html). 

1. Deploy the solution using `sls` command (Serverless framework CLI), `<ENV>` is what you defined for `config.ENV.json`.
If you are using AWS China region, you should add `AWS_PARTITION=aws-cn` environment variable before the command. If you
are using the default AWS profile, you can eliminate the parameter.
    ```shell
    sls deploy --aws-profile <profile> --stage <ENV>
    ```

1. Once the deployment finished, go to the AWS SNS Service console. In **SNS Topic**, find `emr-scale-out-failed` 
and add your **Email Subscription** to this topic. You will need to confirm in your mailbox to receive the notification.

1. The last task in your EMR steps is to call the `aws-emr-customized-scaling-<ENV>-scale-in` Lambda 
to scale in your EMR Group. 


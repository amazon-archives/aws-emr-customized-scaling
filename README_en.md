# Customize EMR Schedule

Architecture

![](assets/arch-1.jpg)

The entire automatic creation depends on [Serverless Framework](https://serverless.com).


## Prerequisites

1. AWS CLI 

1. AWS Credentials (Access Key Id and Access Key Secret) has been configured.

1. Node.js 6 or higher version.

## Getting Started

**1.** Install [Serverless Framework CLI](https://serverless.com).
```shell
npm install serverless -g
```

**2.** Clone this repo 

```shell
git clone https://github.com/lab798/aws-emr-schedule.git
cd aws-emr-schedule
```

**3.** Create a json file named `config.ENV.json`, where `ENV` is the name of your stage. Here you can find a sample file `config.dev.json`. 

**4.** Change the parameters in `config.ENV.json` to your custom parameters according to the sample `config.dev.json`.

**5.** In **serverless.yml**, find `cron(0 19 * * ? *)`. This is for CloudWatch Event to trigger the Lambda regularly. You can change it to you custom Lambda trigger time.

**6.** In `emr.js`, Modify **TODO** part to submit your **EMR Step**. 

**7.** Deploy **serverless framework**
```shell
sls deploy --aws-profile default --stage <ENV>
```

* Here \<ENV\> is what you defined for `config.ENV.json`.

**8.** After the Deploy finished, go to your AWS SNS Service console. In **SNS Topic**, find `emr-scale-out-failed` and add your **Email Subscription** to this topic.

**9.** In the script that for the completion of EMR Step, call the `aws-emr-schedule-ENV-scale-in` Lambda to scale in your EMR Group.

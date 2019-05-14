const AWS = require('aws-sdk');
const config = require('./config.dev.json');

const emr = new AWS.EMR({
  region: config.region || 'cn-northwest-1'
});

const sns = new AWS.SNS({
  region: config.region || 'cn-northwest-1'
});

const CLUSTER_ID = config.emr_cluster_id;
const INSTANCE_GROUP_ID =  config.emr_instance_group_id;
const TIMEOUT = config.emr_timeout;

exports.scaleOut =  async (event, context) => {

  console.info(JSON.stringify(event));
  console.info(JSON.stringify(context));

  let _timeout = TIMEOUT;
  const params = {
    ClusterId: CLUSTER_ID,
    InstanceGroups: [
      {
        InstanceGroupId: INSTANCE_GROUP_ID,
        InstanceCount: config.emr_desired_instance_count
      }
    ]
  };

  const topicArn = `arn:aws-cn:sns:${config.region}:${getAccountId(context)}:emr-scale-out-failed`;

  // Scale out instance group
  await emr.modifyInstanceGroups(params).promise();
  // wait for cluster to run into resizing status, wait for 2 minutes

  const errMessage = `EMR cluster ${CLUSTER_ID} scale out failed`;

  // Loop to get instance group status
  while (1) {
    await sleep(10 * 1000);
    _timeout -= 10;

    if (_timeout < 0) {
      const snsParams = {
        TopicArn: topicArn,
        Message: errMessage
      };

      await sns.publish(snsParams).promise();

      throw new Error(errMessage);
    }

    const instanceGroup = await getInstanceGroup(CLUSTER_ID, INSTANCE_GROUP_ID);

    console.log(`status: ${instanceGroup.Status.State}, requested: ${instanceGroup.RequestedInstanceCount}, current: ${instanceGroup.RunningInstanceCount}`);

    if (instanceGroup.Status.State === 'RUNNING' && instanceGroup.RequestedInstanceCount <= instanceGroup.RunningInstanceCount) {
      // TODO: INSERT CODE HERE TO submit EMR step

      return 'OK'
    }
  }

};


exports.scaleIn = async () => {

  const params = {
    ClusterId: CLUSTER_ID,
    InstanceGroups: [
      {
        InstanceGroupId: INSTANCE_GROUP_ID,
        InstanceCount: config.emr_initial_instance_count
      }
    ]
  };

  return await emr.modifyInstanceGroups(params).promise();
};


async function getInstanceGroup(clusterId, groupId) {

  const groupsData = await emr.listInstanceGroups({ ClusterId: clusterId }).promise();

  return groupsData.InstanceGroups.find(group => group.Id === groupId );

}

function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

function getAccountId(context) {
  return context.invokedFunctionArn.split(':')[4]
}

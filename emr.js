const AWS = require('aws-sdk');
const config = require('./config.dev.json')
const emr = AWS.EMR({
  region: process.env.AWS_REGION || 'cn-northwest-1'
});

const sns = AWS.SNS({
  region: process.env.AWS_REGION || 'cn-northwest-1'
});

const CLUSTER_ID = config.emr_cluster_id;
const INSTANCE_GROUP_ID =  config.emr_instance_group_id;
const INTERVAL = config.emr_interval;
const timeout = config.emr_timeout;

exports.scaleOut =  async (event, context) => {
  let _timeout = timeout;

  const params = {
    ClusterId: CLUSTER_ID,
    InstanceGroups: {
      InstanceGroupId: INSTANCE_GROUP_ID,
      InstanceCount: config.emr_desired_instance_count || 3
    }
  };

  // Scale out instance group
  await emr.modifyInstanceGroups(params).promise();

  // Loop to get instance group status
  const interval = setInterval(async () => {
    _timeout -= INTERVAL;
    const message = `EMR cluster ${CLUSTER_ID} scale out failed`;

    if (_timeout < 0) {
      const snsParams = {
        TopicArn: config.emr_topic_arn,
        Message: message
      };

      await sns.publish(snsParams).promise();
      clearInterval(interval);
      throw new Error(message);
    }

    const status = await getInstanceGroupStatus(CLUSTER_ID, INSTANCE_GROUP_ID);

    if (status === 'RUNNING') {
       clearInterval(interval);
       return 'Scale out finished';
    }

  }, INTERVAL * 1000);

};


exports.scaleIn = async (event, context) => {

  const params = {
    ClusterId: CLUSTER_ID,
    InstanceGroups: {
      InstanceGroupId: INSTANCE_GROUP_ID,
      InstanceCount: config.emr_initial_instance_count || 1
    }
  };

  return await emr.modifyInstanceGroups(params).promise();

};


/**
 * Get the instance Group status by cluster Id and groupID
 * @param clusterId
 * @param groupId
 * @returns {String}
 */
async function getInstanceGroupStatus(clusterId, groupId) {

  const groupsData = await emr.listInstanceGroups({ ClusterId: clusterId }).promise();

  const instanceGroup = groupsData.InstanceGroups.find(group => group.Id === groupId );

  return instanceGroup.Status.State
}

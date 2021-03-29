import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import SubscriberUser from 'src/model/subscriberUser';
import DynamoDb, { getUpdateExpression } from '../common/dynamodb-lib';

const TABLE_NAME: string = process.env.subscriberUserTable;
const KEY = 'mobileNumber';

async function create(subscriberUser: SubscriberUser): Promise<SubscriberUser> {
	const params: DocumentClient.PutItemInput = {
    TableName: TABLE_NAME,
    Item: subscriberUser,
    ConditionExpression: 'attribute_not_exists(mobileNumber)'
  };
  await DynamoDb.put(params);
  return subscriberUser;
}

async function del(id: string): Promise<string> {
  const params: DocumentClient.DeleteItemInput = {
    TableName: TABLE_NAME,
    Key: {
      mobileNumber: id,
    }
  };
  await DynamoDb.delete(params);
  return id;
}

async function update(id: string, subscriberUser: SubscriberUser): Promise<SubscriberUser> {
  const update = getUpdateExpression(KEY, subscriberUser);
  const params: DocumentClient.UpdateItemInput = {
    TableName: TABLE_NAME,
    Key: {
      mobileNumber: id,
    },
    UpdateExpression: update.expression,
    ExpressionAttributeValues: update.values,
    ReturnValues: "ALL_NEW"
  };
  const result = await DynamoDb.update(params);
  return result.Attributes as SubscriberUser;
}

async function get(id: string): Promise<SubscriberUser> {
	const params: DocumentClient.GetItemInput = {
    TableName: TABLE_NAME,
    Key: {
      mobileNumber: id,
    }
  };
  const result = await DynamoDb.get(params);
  if (result.Item) {
    return result.Item as SubscriberUser;
  }
  return undefined;
}

export default {
  create,
  delete: del,
  update,
  get
}

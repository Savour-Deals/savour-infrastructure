import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import PushItem from 'src/model/push';
import DynamoDb from '../common/dynamodb-lib';

const TABLE_NAME: string = process.env.pushMessageTable;

async function create(pushItem: PushItem): Promise<PushItem> {
	const params: DocumentClient.PutItemInput = {
    TableName: TABLE_NAME,
    Item: pushItem,
    ConditionExpression: 'attribute_not_exists(id)'
  };
  await DynamoDb.put(params);
  return pushItem;
}

async function del(id: string): Promise<string> {
  const params: DocumentClient.DeleteItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    }
  };
  await DynamoDb.delete(params);
  return id;
}

async function getAllForBusiness(businessId: string): Promise<PushItem[]> {
  const params: DocumentClient.QueryInput = {
    TableName: process.env.pushMessageTable,
    IndexName: "businessId-index",

    KeyConditionExpression: "businessId = :id",
    ExpressionAttributeValues: {
      ":id": businessId
    }
  };

  const result = await DynamoDb.query(params);
  return result.Items as PushItem[] || [];
}

async function get(id: string): Promise<PushItem> {
	const params: DocumentClient.GetItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    }
  };
  const result = await DynamoDb.get(params);
  if (result.Item) {
    return result.Item as PushItem;
  }
  return undefined;
}

export default {
  create,
  delete: del,
  getAllForBusiness,
  get
}

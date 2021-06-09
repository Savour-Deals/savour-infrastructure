import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import Campaign from 'src/model/campaign';
import DynamoDb from '../common/dynamodb-lib';

const TABLE_NAME: string = process.env.pushMessageTable;

async function create(campaign: Campaign): Promise<Campaign> {
	const params: DocumentClient.PutItemInput = {
    TableName: TABLE_NAME,
    Item: campaign,
  };
  await DynamoDb.put(params);
  return campaign;
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

async function getAllForBusiness(businessId: string): Promise<Campaign[]> {
  const params: DocumentClient.QueryInput = {
    TableName: process.env.pushMessageTable,
    IndexName: "businessId-index",

    KeyConditionExpression: "businessId = :id",
    ExpressionAttributeValues: {
      ":id": businessId
    }
  };

  const result = await DynamoDb.query(params);
  return result.Items as Campaign[] || [];
}

async function get(id: string): Promise<Campaign> {
	const params: DocumentClient.GetItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    }
  };
  const result = await DynamoDb.get(params);
  if (result.Item) {
    return result.Item as Campaign;
  }
  return undefined;
}

export default {
  create,
  delete: del,
  getAllForBusiness,
  get
}

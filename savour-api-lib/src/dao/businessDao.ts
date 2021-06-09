import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import Business from 'src/model/business';
import DynamoDb, { getUpdateExpression } from '../common/dynamodb-lib';

const TABLE_NAME: string = process.env.businessTable;
const KEY = 'id';

interface BusinessGSI {
  name: string,
  keyName: string
}

async function create(business: Business): Promise<Business> {
	const params: DocumentClient.PutItemInput = {
    TableName: TABLE_NAME,
    Item: business,
    ConditionExpression: 'attribute_not_exists(id)'
  };
  await DynamoDb.put(params);
  return business;
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

async function update(id: string, business: Business): Promise<Business> {
  const update = getUpdateExpression(KEY, business);
  const params: DocumentClient.UpdateItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    },
    UpdateExpression: update.expression,
    ExpressionAttributeValues: update.values,
    ReturnValues: "ALL_NEW"
  };
  const result = await DynamoDb.update(params);
  return result.Attributes as Business;
}

async function get(id: string): Promise<Business> {
	const params: DocumentClient.GetItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    }
  };
  const result = await DynamoDb.get(params);
  if (result.Item) {
    return result.Item as Business;
  }
  return undefined;
}

async function queryBy(key: string, index: BusinessGSI): Promise<Business[]> {
  const params: DocumentClient.QueryInput = {
    TableName: TABLE_NAME,
    IndexName: index.name,
    KeyConditionExpression: `${index.keyName} = :t`,
    ExpressionAttributeValues: {
      ":t": key
    }
  };
  const result = await DynamoDb.query(params);
  return result.Items.length > 0 ? result.Items as Business[] : []
}

async function unsubscribe(id: string): Promise<Business> {
  const params: DocumentClient.UpdateItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    },
    UpdateExpression: "REMOVE stripeSubId, stripeRecurringSubItem, stripeUsageSubItem",
    ReturnValues: "ALL_NEW"
  };
  const result = await DynamoDb.update(params);
  return result.Attributes as Business;
}

export const BusinessGSIs = {
  messagingNumberIndex: {
    name: "messagingNumber-index",
    keyName: "messagingNumber"
  }
}

export default {
  create,
  delete: del,
  update,
  get,
  queryBy,
  unsubscribe
}

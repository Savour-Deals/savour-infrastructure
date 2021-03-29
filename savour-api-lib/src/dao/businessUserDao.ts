import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import BusinessUser from 'src/model/businessUser';
import DynamoDb, { getUpdateExpression } from '../common/dynamodb-lib';

const TABLE_NAME: string = process.env.businessUserTable;
const KEY = 'id';

async function create(businessUser: BusinessUser): Promise<BusinessUser> {
	const params: DocumentClient.PutItemInput = {
    TableName: TABLE_NAME,
    Item: businessUser,
    ConditionExpression: 'attribute_not_exists(id)'
  };
  await DynamoDb.put(params);
  return businessUser;
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

async function update(id: string, businessUser: BusinessUser): Promise<BusinessUser> {
  const update = getUpdateExpression(KEY, businessUser);
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
  return result.Attributes as BusinessUser;
}

async function get(id: string): Promise<BusinessUser> {
	const params: DocumentClient.GetItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    }
  };
  const result = await DynamoDb.get(params);
  if (result.Item) {
    return result.Item as BusinessUser;
  }
  return undefined;
}

export default {
  create,
  delete: del,
  update,
  get
}

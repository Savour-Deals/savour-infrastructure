import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import DynamoDb from '../common/dynamodb-lib';

const TABLE_NAME: string = process.env.redirectTable;

interface RedirectItem {
	id: string,
	destinationUrl: string,
	shortUrl: string
}

async function create(campaign: RedirectItem): Promise<RedirectItem> {
	const params: DocumentClient.PutItemInput = {
    TableName: TABLE_NAME,
    Item: campaign,
    ConditionExpression: 'attribute_not_exists(id)'
  };
  await DynamoDb.put(params);
  return campaign;
}

async function get(id: string): Promise<RedirectItem> {
	const params: DocumentClient.GetItemInput = {
    TableName: TABLE_NAME,
    Key: {
      id: id,
    }
  };
  const result = await DynamoDb.get(params);
  if (result.Item) {
    return result.Item as RedirectItem;
  }
  return undefined;
}

export default {
  create,
  get
}

import * as sst from "@serverless-stack/resources";
import DynamoDBStack from './DynamoDBStack';

interface DynamoDbTableDefintion {
  tableName: string;
  partitionKey: string;
}

const DYNAMO_TABLES: Array<DynamoDbTableDefintion> = [
  { tableName: 'business_users', partitionKey: 'uid' },
  { tableName: 'businesses', partitionKey: 'place_id' },
  { tableName: 'push_table', partitionKey: 'unique_id' },
  { tableName: 'redirect_urls', partitionKey: 'unique_id' },
  { tableName: 'subscriber_users', partitionKey: 'mobile_number' },
  { tableName: 'unclaimed_buttons', partitionKey: 'button_id' },

]

export default class SavourDashboardStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope,id,props);

    this.createDynamoTables(DYNAMO_TABLES);

  }

  createDynamoTables(tables: Array<object>) {
    for (const table of  tables) {
      
    }
  }
}


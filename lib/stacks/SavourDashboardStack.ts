import { App, Stack, StackProps } from "@serverless-stack/resources";

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
];

export default class SavourDashboardStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope,id,props);

    this.createDynamoTables(DYNAMO_TABLES);

  }

  createDynamoTables(tables: Array<object>) {
    for (const table of  tables) {
      
    }
  }
}


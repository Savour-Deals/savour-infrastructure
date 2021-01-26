import { App, Stack, StackProps } from "@serverless-stack/resources";
import { CfnOutput } from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import { DynamoDBTable } from "../constructs/dynamodb/dynamodb-table";

interface DynamoDbTableDefinition {
  tableName: string;
  partitionKey: string;
}

const DYNAMO_TABLES: Array<DynamoDbTableDefinition> = [
  { tableName: 'business_users', partitionKey: 'uid' },
  { tableName: 'businesses', partitionKey: 'place_id' },
  { tableName: 'redirect_urls', partitionKey: 'unique_id' },
  { tableName: 'subscriber_users', partitionKey: 'mobile_number' },
];

export default class SavourDashboardStack extends Stack {
  app: App;
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope,id,props);

    this.app = scope;

    this.createDynamoTables(DYNAMO_TABLES);

  }

  createDynamoTables(tables: Array<DynamoDbTableDefinition>) {

    
    for (const table of  tables) {
      const { tableName, partitionKey } = table;
      
      new DynamoDBTable(this as any, "dev-" + tableName,"dev-" + tableName, partitionKey);
      new DynamoDBTable(this as any, "prod-" + tableName,"prod-" + tableName, partitionKey);

      // this.createTable(tableName + '_dev', partitionKey);
      // this.createTable(tableName + '_prod', partitionKey);
    }
  }
}


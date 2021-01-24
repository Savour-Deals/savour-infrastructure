import { App, Stack, StackProps } from "@serverless-stack/resources";
import { CfnOutput } from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

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
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope,id,props);

    this.createDynamoTables(DYNAMO_TABLES);

  }

  createDynamoTables(tables: Array<DynamoDbTableDefinition>) : void {

    
    for (const table of  tables) {
      const { tableName, partitionKey } = table;
      
      this.createTable(tableName + '_dev', partitionKey);
      this.createTable(tableName + '_prod', partitionKey);
    }
  }

  createTable(tableName: string, partitionKey: string): void {
    const app: any = this.node.root;
    
    try {
      const createdTable = new dynamodb.Table(this, tableName, {
        partitionKey: {name: partitionKey, type: dynamodb.AttributeType.STRING},
      });

      new CfnOutput(this, "TableName", {
        value: createdTable.tableName,
        exportName: app.logicalPrefixedName("TableName"),
      
      });

      new CfnOutput(this, "TableArn", {
        value: createdTable.tableArn,
        exportName: app.logicalPrefixedName("TableArn"),
      });
    } catch (e) {
      console.log(e);
      console.log(tableName + " already exists.");
    }
  }
}


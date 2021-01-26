import { CfnOutput, Stack } from "@aws-cdk/core";
import { Table, TableProps, BillingMode, AttributeType } from "@aws-cdk/aws-dynamodb";
import { App } from "@serverless-stack/resources";

export type DynamoDBTableProps = TableProps

interface DynamoDbTableDefinition {
  tableName: string;
  partitionKey: string;
}

const DYNAMO_TABLES: Array<DynamoDbTableDefinition> = [
  { tableName: 'BusinessUser', partitionKey: 'uid' },
  { tableName: 'Business', partitionKey: 'place_id' },
  { tableName: 'Redirect', partitionKey: 'unique_id' },
  { tableName: 'SubscriberUser', partitionKey: 'mobile_number' },
  { tableName: 'PushMessage', partitionKey: 'uid' },

];

export class DynamoDBTable extends Stack {
  scope: App;
	constructor(scope: App, id: string) {
    super(scope, id);
    this.scope = scope;
    console.log(scope.stageName);
    console.log(scope.stage);
    console.log(scope.region);
    this.createDynamoTables(DYNAMO_TABLES);
  }

  createDynamoTables(tables: Array<DynamoDbTableDefinition>) {
    for (const table of  tables) {
      const { tableName, partitionKey } = table;

      this.createTable(`dev-${tableName}`, partitionKey);
      this.createTable(`prod-${tableName}`, partitionKey);
    }
  }

  createTable(tableName: string, partitionKey: string) {
    try {
      const table = new Table(this, tableName, {
        tableName: tableName,
        billingMode: BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
        partitionKey: { name: partitionKey, type: AttributeType.STRING },
      });
      
      // Output values
      new CfnOutput(this, tableName + "-TableName", {
        value: table.tableName,
        exportName: tableName  + "-TableName",
      });
      new CfnOutput(this, tableName + "-TableArn", {
        value: table.tableArn,
        exportName: tableName,
      });
    } catch (e) {
      console.log(e);
    }
  }
}
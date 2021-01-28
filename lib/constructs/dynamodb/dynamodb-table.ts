import { CfnOutput, Stack } from "@aws-cdk/core";
import { Table, TableProps, BillingMode, AttributeType, GlobalSecondaryIndexProps } from "@aws-cdk/aws-dynamodb";
import { App } from "@serverless-stack/resources";

export type DynamoDBTableProps = TableProps

interface DynamoDbTableDefinition {
  tableName: string;
  partitionKey: string;
  globalSecondaryIndexes?: Array<GlobalSecondaryIndexProps>;
}

const pushTableGSIs: Array<GlobalSecondaryIndexProps> = [
  {partitionKey: {name: 'btn_id', type: AttributeType.STRING}, indexName: 'btn_id-index' },
];
const businessTableGSIs: Array<GlobalSecondaryIndexProps> = [
  {partitionKey: {name: 'btn_id', type: AttributeType.STRING}, indexName: 'btn_id-index' },
  {partitionKey: {name: 'twilio_number', type: AttributeType.STRING}, indexName: 'twilio_number-index' },

];
const DYNAMO_TABLES: Array<DynamoDbTableDefinition> = [
  { tableName: 'BusinessUser', partitionKey: 'uid' },
  { tableName: 'Business', partitionKey: 'place_id', globalSecondaryIndexes: businessTableGSIs },
  { tableName: 'Redirect', partitionKey: 'unique_id' },
  { tableName: 'SubscriberUser', partitionKey: 'mobile_number' },
  { tableName: 'PushMessage', partitionKey: 'uid', globalSecondaryIndexes: pushTableGSIs},

];

export class DynamoDBTable extends Stack {
  scope: App;
	constructor(scope: App, id: string) {
    super(scope, id);
    this.scope = scope;
    this.createDynamoTables(DYNAMO_TABLES);
  }

  createDynamoTables(tables: Array<DynamoDbTableDefinition>) {
    for (const table of  tables) {
      const { tableName, partitionKey, globalSecondaryIndexes } = table;

      this.createTable(`${this.scope.stage}-${tableName}`, partitionKey, globalSecondaryIndexes);
    }
  }

  createTable(tableName: string, partitionKey: string, globalSecondaryIndexes?: Array<GlobalSecondaryIndexProps>) {
    try {
      const table = new Table(this, tableName, {
        tableName: tableName,
        billingMode: BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
        partitionKey: { name: partitionKey, type: AttributeType.STRING },
        
      });

      // TODO: add GSI if exists
      if (globalSecondaryIndexes) {
        for (const globalSecondaryIndex of globalSecondaryIndexes) table.addGlobalSecondaryIndex(globalSecondaryIndex);
      }

      // Output values
      new CfnOutput(this, tableName + "-TableName", {
        value: table.tableName,
        exportName: tableName  + "-TableName",
      });
      new CfnOutput(this, tableName + "-TableArn", {
        value: table.tableArn,
        exportName: tableName + "-TableArn",
      });
    } catch (e) {
      console.log(e);
    }
  }
}
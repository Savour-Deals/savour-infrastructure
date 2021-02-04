import { GlobalSecondaryIndexProps, AttributeType } from "@aws-cdk/aws-dynamodb";
import { App, Stack, StackProps } from "@serverless-stack/resources";
import { DynamoDBTable, DynamoDbTableProps } from "../constructs/dynamodb/dynamodb-table";

const pushTableGSIs: Array<GlobalSecondaryIndexProps> = [
  {partitionKey: {name: 'btn_id', type: AttributeType.STRING}, indexName: 'btn_id-index' },
];
const businessTableGSIs: Array<GlobalSecondaryIndexProps> = [
  {partitionKey: {name: 'btn_id', type: AttributeType.STRING}, indexName: 'btn_id-index' },
  {partitionKey: {name: 'twilio_number', type: AttributeType.STRING}, indexName: 'twilio_number-index' },

];
const DYNAMO_TABLES: Array<DynamoDbTableProps> = [
  { tableName: 'BusinessUser', partitionKey: 'uid' },
  { tableName: 'Business', partitionKey: 'place_id', globalSecondaryIndexes: businessTableGSIs },
  { tableName: 'Redirect', partitionKey: 'unique_id' },
  { tableName: 'SubscriberUser', partitionKey: 'mobile_number' },
  { tableName: 'PushMessage', partitionKey: 'uid', globalSecondaryIndexes: pushTableGSIs},
];

export default class DynamoDbStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope,id,props);

    this.node.setContext('stage', `${scope.stage}`);

    for (const table of DYNAMO_TABLES) {
      new DynamoDBTable(this, `${table.tableName}DdbTable`, {
        tableName: table.tableName,
        partitionKey: table.partitionKey,
        globalSecondaryIndexes: table.globalSecondaryIndexes
      });
    }
  }
}


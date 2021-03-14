import { GlobalSecondaryIndexProps, AttributeType } from "@aws-cdk/aws-dynamodb";
import { App, Stack, StackProps } from "@serverless-stack/resources";
import { DynamoDBTable, DynamoDbTableProps } from "../constructs/dynamodb/dynamodb-table";

const pushTableGSIs: Array<GlobalSecondaryIndexProps> = [
  {partitionKey: {name: 'businessId', type: AttributeType.STRING}, indexName: 'businessId-index' },
];
const businessTableGSIs: Array<GlobalSecondaryIndexProps> = [
  {partitionKey: {name: 'messagingNumber', type: AttributeType.STRING}, indexName: 'messagingNumber-index' },
];
const DYNAMO_TABLES: Array<DynamoDbTableProps> = [
  { tableName: 'BusinessUser', partitionKey: 'id' },
  { tableName: 'Business', partitionKey: 'id', globalSecondaryIndexes: businessTableGSIs },
  { tableName: 'Redirect', partitionKey: 'id' },
  { tableName: 'SubscriberUser', partitionKey: 'mobileNumber' },
  { tableName: 'PushMessage', partitionKey: 'id', globalSecondaryIndexes: pushTableGSIs},
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


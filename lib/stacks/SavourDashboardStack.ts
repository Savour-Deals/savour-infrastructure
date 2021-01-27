import { App, Stack, StackProps } from "@serverless-stack/resources";
import { DynamoDBTable } from "../constructs/dynamodb/dynamodb-table";


export default class SavourDashboardStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope,id,props);
    new DynamoDBTable(scope, id);
  }
}


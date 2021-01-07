import { CfnOutput } from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as sst from "@serverless-stack/resources";

export default class DynamoDBStack extends sst.Stack {
  constructor(scope: sst.App, id: string, tableName: string, partitionKey: string, props?: sst.StackProps) {
    super(scope, id, props);
    
    const app: any = this.node.root;

    const table = new dynamodb.Table(this, "Table", {
      tableName: tableName,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
      partitionKey: { name: partitionKey, type: dynamodb.AttributeType.STRING },
    });
    
    // Output values
    new CfnOutput(this, "TableName", {
      value: table.tableName,
      exportName: app.logicalPrefixedName("TableName"),
    });
    new CfnOutput(this, "TableArn", {
      value: table.tableArn,
      exportName: app.logicalPrefixedName("TableArn"),
    });
  }
}
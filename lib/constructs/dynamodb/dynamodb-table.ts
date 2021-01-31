import { CfnOutput, Construct } from "@aws-cdk/core";
import { Table, BillingMode, AttributeType, GlobalSecondaryIndexProps } from "@aws-cdk/aws-dynamodb";

export interface DynamoDbTableProps {
  tableName: string,
  partitionKey: string,
  globalSecondaryIndexes?: Array<GlobalSecondaryIndexProps>,
}

export class DynamoDBTable extends Construct {
	constructor(scope: Construct, id: string, props: DynamoDbTableProps) {
    super(scope, id);

    const tableName = `${scope.node.tryGetContext('stage')}-${props.tableName}`;

    const table = new Table(this, tableName, {
      tableName: tableName,
      billingMode: BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
      partitionKey: { name: props.partitionKey, type: AttributeType.STRING },
    });

    // TODO: add GSI if exists
    if (props.globalSecondaryIndexes) {
      for (const globalSecondaryIndex of props.globalSecondaryIndexes) table.addGlobalSecondaryIndex(globalSecondaryIndex);
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
  }
}
import { Construct, CfnOutput } from "@aws-cdk/core";
import { Table, TableProps, BillingMode, AttributeType } from "@aws-cdk/aws-dynamodb";
import { App } from "@serverless-stack/resources";

export interface DynamoDBTableProps extends TableProps {
	// Any props to pass to this generic table should be added here
}

export class DynamoDBTable extends Construct {
	constructor(scope: App, id: string, tableName: string, partitionKey: string, props?: DynamoDBTableProps) {
    super(scope, id);
    
    const app: any = this.node.root;

    const table = new Table(this, "Table", {
      tableName: tableName,
      billingMode: BillingMode.PAY_PER_REQUEST, // Use on-demand billing mode
      partitionKey: { name: partitionKey, type: AttributeType.STRING },
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
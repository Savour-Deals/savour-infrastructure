import { App } from "@serverless-stack/resources";
import { DynamoDBTable } from "./constructs/dynamodb/dynamodb-table";
export default function main(app: App): void {
	new DynamoDBTable(app, `${app.stage}-dynamodb`);
}
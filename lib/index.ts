import { App } from "@serverless-stack/resources";
import LambdaApiStack from "./stacks/lambda-api-stack";
import DynamoDbStack from "./stacks/dynamodb-stack";

export default function main(app: App): void {
	new DynamoDbStack(app, `${app.stage}-savour-dynamodb`);
	new LambdaApiStack(app, '${app.stage}-savour-lambda-api');
}
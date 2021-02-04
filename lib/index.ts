import { App } from "@serverless-stack/resources";
import LambdaApiStack from "./stacks/lambda-api-stack";
import DynamoDbStack from "./stacks/dynamodb-stack";

export default function main(app: App): void {
	// Stack id will be prepended with <stage>-savour-infrastructure
	new DynamoDbStack(app, `dynamodb`);
	new LambdaApiStack(app, `lambda-api`);
}
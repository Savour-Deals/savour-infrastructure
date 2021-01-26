import { App } from "@serverless-stack/resources";
import LambdaApiStack from "./stacks/lambda-api-stack";
import SavourDashboardStack from "./stacks/savour-dashboard-stack";

export default function main(app: App): void {
	new SavourDashboardStack(app, "savour-dashboard");
	new LambdaApiStack(app, "savour-lambda-api");
}
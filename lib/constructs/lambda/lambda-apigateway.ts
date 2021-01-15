import { Construct } from "@aws-cdk/core";
import { Function, FunctionProps, Code, Runtime } from "@aws-cdk/aws-lambda";
import { App } from "@serverless-stack/resources";

export interface LambdaApiGatewayProps extends FunctionProps {
	// Any props to pass to this generic table should be added here
}

export class LambdaApiGateway extends Construct {
	constructor(scope: App, id: string,  props?: LambdaApiGatewayProps) {
    super(scope, id);
    
		// const handler = new Function(this, "", {
		// 	runtime: Runtime.NODEJS_10_X,
		// 	code: Code.fromAsset(""),
		// 	handler: "handler"
		// });
  }
}
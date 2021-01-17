import { Construct } from "@aws-cdk/core";
import { Function, Code, Runtime } from "@aws-cdk/aws-lambda";
import { App } from "@serverless-stack/resources";

export interface SavourApiLambdaProps {
	// Any props to pass to this generic lambda API should be added here
	api: string,
	operation: string,
	environment?: {	
		[key: string]: string;
	}
	// http: {
	// 	path: string
	// 	method: string
	// 	cors: boolean
	// 	authorizer: string
	// }
}

export class SavourApiLambda extends Construct {

	
	constructor(scope: App, id: string,  props: SavourApiLambdaProps) {
		super(scope, id);
		
		const handler = new Function(this, "", {
			runtime: Runtime.NODEJS_10_X,
			code: Code.fromAsset("./savour-api-lib"),
			handler: `src/${props.api}/index.${props.operation}`,
			environment: props.environment
		});
    
  }
}
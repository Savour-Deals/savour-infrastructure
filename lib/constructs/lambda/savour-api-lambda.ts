import { Construct, Fn } from "@aws-cdk/core";
import { Function, Code, Runtime } from "@aws-cdk/aws-lambda";
import { LambdaIntegration, LambdaIntegrationOptions, AuthorizationType, Resource, Method } from "@aws-cdk/aws-apigateway"

export interface SavourApiLambdaProps {
	// Any props to pass to this generic lambda API should be added here
	api: string,
	operation: string,
	environment?: {	
		[key: string]: string;
	},
	restApi: {
		resource: Resource
		httpMethod: string
		pathParameter?: string
		LambdaIntegrationOptions?: LambdaIntegrationOptions
	}
}

// TODO: Make this reference specific stage tables
const ddbTables = {
	businessTable: Fn.importValue('dev-business-table-name'),
	businessUserTable: Fn.importValue('dev-business-user-table-tame'),
	subscriberUserTable: Fn.importValue('dev-subscriber-user-table-name'),
	pushMessageTable: Fn.importValue('dev-push-message-table-name'),
	// unclaimedButtonTable: Fn.importValue('dev-UnclaimedButton-TableName'),
	redirectTable: Fn.importValue('dev-redirect-table-name')
};

export class SavourApiLambda extends Construct {
	public readonly method: Method;
	
	constructor(scope: Construct, props: SavourApiLambdaProps) {
		super(scope, `${props.api}-${props.operation}`);
		
		const restApi = props.restApi;
		let apiResource = restApi.resource;

		//If path parameter is used, add resource to reference it
		if (!!props.restApi.pathParameter) {
			apiResource = apiResource.addResource(`{${props.restApi.pathParameter}}`);
		}
		
		// Give all lambdas name of our dynamo tables
		const environment = {...ddbTables, ...props.environment}

		// Define function
		const handler = new Function(this, "", {
			runtime: Runtime.NODEJS_10_X,
			code: Code.fromAsset("./savour-api-lib"),
			handler: `src/index.${props.api}.${props.operation}`,
			environment: environment,
		});


		this.method = apiResource.addMethod(restApi.httpMethod, new LambdaIntegration(handler), {
			authorizationType: AuthorizationType.IAM,
		});

		if(true) {
			this.method.
		}
  }
}
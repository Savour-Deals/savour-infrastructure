import { Construct, Fn } from "@aws-cdk/core";
import { Function, Code, Runtime } from "@aws-cdk/aws-lambda";
import { LambdaIntegration, MethodResponse, LambdaIntegrationOptions, AuthorizationType, Resource, Method, MethodOptions } from "@aws-cdk/aws-apigateway"

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
		lambdaIntegrationOptions?: LambdaIntegrationOptions,
	}
}

export class SavourApiLambda extends Construct {
	public readonly method: Method;
	
	constructor(scope: Construct, props: SavourApiLambdaProps) {
		super(scope, `${props.api}-${props.operation}`);

		const stage = scope.node.tryGetContext('stage');
		const ddbTables = {
			businessTable: Fn.importValue(`${stage}-Business-TableName`),
			businessUserTable: Fn.importValue(`${stage}-BusinessUser-TableName`),
			subscriberUserTable: Fn.importValue(`${stage}-SubscriberUser-TableName`),
			pushMessageTable: Fn.importValue(`${stage}-PushMessage-TableName`),
			// unclaimedButtonTable: Fn.importValue('dev-UnclaimedButton-TableName),
			redirectTable: Fn.importValue(`${stage}-Redirect-TableName`)
		};

		const restApi = props.restApi;
		let apiResource = restApi.resource;

		//If path parameter is used, add resource to reference it
		if (props.restApi.pathParameter) {
			apiResource = apiResource.resourceForPath(`{${props.restApi.pathParameter}}`);
		}

		// Define function
		const handler = new Function(this, `${props.api}-${props.operation}`, {
			runtime: Runtime.NODEJS_10_X,
			code: Code.fromAsset("./savour-api-lib"),
			handler: `src/index.${props.api}.${props.operation}`,
			environment: {...ddbTables, ...props.environment}
		});
		
		const methodResponses: MethodResponse[] = [];
		if (restApi.lambdaIntegrationOptions?.integrationResponses) {
			restApi.lambdaIntegrationOptions.integrationResponses.forEach((r) => {
				const keys = Object.keys(r.responseParameters || {});
				const params: {[destination: string]: boolean} = {}

				keys.forEach((k) => {
					params[k] = true;
				});

				methodResponses.push({
					statusCode: r.statusCode,
					responseParameters: !keys.length? undefined : params
				});
			});
		}
		
		this.method = apiResource.addMethod(restApi.httpMethod, new LambdaIntegration(handler, restApi.lambdaIntegrationOptions), {
				authorizationType: AuthorizationType.IAM,
				methodResponses: !methodResponses.length? undefined : methodResponses
			}
		);
  }
}
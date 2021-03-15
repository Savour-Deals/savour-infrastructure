import { Construct, Fn } from "@aws-cdk/core";
import { Function, Code, Runtime } from "@aws-cdk/aws-lambda";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { LambdaIntegration, MethodResponse, LambdaIntegrationOptions, AuthorizationType, Resource, Method } from "@aws-cdk/aws-apigateway"

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
		const commonEnv = {
			businessTable: Fn.importValue(`${stage}-Business-TableName`),
			businessUserTable: Fn.importValue(`${stage}-BusinessUser-TableName`),
			subscriberUserTable: Fn.importValue(`${stage}-SubscriberUser-TableName`),
			pushMessageTable: Fn.importValue(`${stage}-PushMessage-TableName`),
			// unclaimedButtonTable: Fn.importValue('dev-UnclaimedButton-TableName),
			redirectTable: Fn.importValue(`${stage}-Redirect-TableName`),
			stage: stage,
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
			code: Code.fromAsset(`./savour-api-lib/dist/${props.api}-${props.operation}.zip`),
			handler: `src/${props.api}/${props.operation}.default`,
			environment: {...commonEnv, ...props.environment},
		});

		handler.addToRolePolicy(new PolicyStatement({
      resources: ['*'],
      actions: ['dynamodb:*'],
    }));
		
		const methodResponses: MethodResponse[] = [];
		let integrationOptions = restApi.lambdaIntegrationOptions;
		if (integrationOptions) {
			if (integrationOptions.integrationResponses) {
				//if integration options and responses are set, we want a custom integration. Below is to reduce the
				//setup code by setting response variables
				integrationOptions.integrationResponses.forEach((r) => {
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
		} else {
			//if integration options are not set, we should proxy
			//this also will allow cors headers to pass back to client
			integrationOptions = { proxy: true };
			methodResponses.push({
				statusCode: '200',
				responseParameters: {
					'method.response.header.Access-Control-Allow-Headers': true,
					'method.response.header.Access-Control-Allow-Methods': true,
					'method.response.header.Access-Control-Allow-Origin': true,
					'method.response.header.Access-Control-Allow-Credentials': true					
				}
			});
		}
		
		this.method = apiResource.addMethod(restApi.httpMethod, new LambdaIntegration(handler, integrationOptions), {
				authorizationType: AuthorizationType.IAM,
				methodResponses: methodResponses,
			}
		);
  }
}
import { UrlApiStack } from './nested-stacks/url-api-stack';
import { SubscriberApiStack } from './nested-stacks/subscriber-api-stack';
import { PushApiStack } from './nested-stacks/push-api-stack';
import { PaymentApiStack } from './nested-stacks/payment-api-stack';
import { MessageApiStack } from './nested-stacks/message-api-stack';
import { BusinessApiStack } from './nested-stacks/business-api-stack';
import { Stack, StackProps } from "@aws-cdk/core";
import { App } from "@serverless-stack/resources";
import { BusinessUserApiStack } from "./nested-stacks/business-user-api-stack";
import { Deployment, Stage, RestApi, Cors } from "@aws-cdk/aws-apigateway"
import { SavourApiNestedStack } from '../constructs/nested-stack/api-nested-stack';

export default class LambdaApiStack extends Stack {
  
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);
    
    // Define an API Gateway REST API for lambda.
    const restApi = new RestApi(this, 'RestApi', {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS // this is also the default
      },
      deploy: false,
    });

    const stacks: SavourApiNestedStack[] = [
      new BusinessApiStack(this, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
      }),
      new BusinessUserApiStack(this, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
      }),
      new MessageApiStack(this, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
      }),
      new PaymentApiStack(this, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
      }),
      new PushApiStack(this, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
      }),
      new SubscriberApiStack(this, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
      }),
      new UrlApiStack(this, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
      }),
    ];

    const deployment = new Deployment(this, 'Deployment', {
      api: RestApi.fromRestApiId(this, 'RestApi', restApi.restApiId),
    });
    
    // Make sure all API stacks are deployed before deploying ApiGateway
    stacks.forEach((stack) => {
      stack.apiLambdas.forEach((api) => deployment.node.addDependency(api.method))
    });
    new Stage(this, 'Stage', { deployment });
  }
}
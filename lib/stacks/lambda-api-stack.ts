import { UrlApiStack } from './nested-stacks/url-api-stack';
import { SubscriberApiStack } from './nested-stacks/subscriber-api-stack';
import { PushApiStack } from './nested-stacks/push-api-stack';
import { PaymentApiStack } from './nested-stacks/payment-api-stack';
import { MessageApiStack } from './nested-stacks/message-api-stack';
import { BusinessApiStack } from './nested-stacks/business-api-stack';
import { CfnResource, StackProps } from "@aws-cdk/core";
import { App, Stack } from "@serverless-stack/resources";
import { BusinessUserApiStack } from "./nested-stacks/business-user-api-stack";
import { Deployment, Stage, RestApi, Cors } from "@aws-cdk/aws-apigateway"
import { SavourApiNestedStack } from '../constructs/nested-stack/api-nested-stack';
import * as ssm from '@aws-cdk/aws-ssm';

export default class LambdaApiStack extends Stack {
  
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    this.node.setContext('stage', `${scope.stage}`);
    
    // Define an API Gateway REST API for lambda.
    const restApi = new RestApi(this, `${scope.stage}-savour-rest-api`, {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS, // this is also the default
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
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
      api: restApi,
    });
    
    // Make sure all API stacks are deployed before deploying ApiGateway
    stacks.forEach((stack) => {
      stack.apiLambdas.forEach((api) => (deployment.node.defaultChild! as CfnResource).addDependsOn(api.method.node.defaultChild as CfnResource))//deployment.node.addDependency(api.method))
    });

    new Stage(this, 'Stage', { deployment, stageName: `${scope.stage}` });

    const executeUrl = `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/${scope.stage}`;

    //export this api execution url
    new ssm.StringParameter(this, 'ApiExecuteUrl', {
      description: `API Execute URL for ${scope.stage}`,
      parameterName: `/api/execute-url/${scope.stage}`,
      stringValue: executeUrl,
      tier: ssm.ParameterTier.STANDARD
    });
  }
}
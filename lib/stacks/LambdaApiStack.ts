import { SavourApiLambda } from '../constructs/lambda/savour-api-lambda';
import { Stack, StackProps } from "@aws-cdk/core";
import { App } from "@serverless-stack/resources";

interface APIGatewayLambdaDefintion {
  apiName: string;
}

enum Apis {
  BUSINESS = "business",
  BUSINESS_USER = "business_user",
  MESSAGE = "message_service",
  PAYMENT = "payment",
  PUSH = "push_table",
  SUBSCRIBER_USER = "subscriber_user",
  URL_SHORTENER = "url_shortener"
}

export default class LambdaApiStack extends Stack {

  
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    for (const api in Apis) {
      this.buildGenericLambdasForApi(scope, Apis.BUSINESS);
    }

    // Build the specialized ApiGateway Lambdas that require request/response mappers
    // Message Service Specialized APIs [hooks]
    this.buildMessageServiceLambdaApis(scope);

    // URL Shortener Specialized APIs [shortenUrl, redirect]
    this.buildUrlShortenerLambdaApis(scope);
  }

  private getGenericOperationsForApi(api: string) {
    switch (api) {
      case Apis.BUSINESS: 
      case Apis.BUSINESS_USER: 
      case Apis.SUBSCRIBER_USER: 
        return ["get", "update", "create", "del"];
      case Apis.MESSAGE: 
        return ["createNumber", "buttonService", "sendMessage"];
      case Apis.PAYMENT: 
        return ["cancelSubscription", "create", "updateCard", "updateUsage"];
      case Apis.PUSH: 
        return ["get", "getAll", "create", "del"];
      case Apis.URL_SHORTENER: 
        return [];
      default:
        throw 'Unknown API';
    }
  }

  private buildGenericLambdasForApi(scope: App, api: string) {
    const operations = this.getGenericOperationsForApi(api);
    for (const operation in operations) {
      new SavourApiLambda(scope, api, {
        api: api,
        operation: operation,
      });
    }
  }

  private buildMessageServiceLambdaApis(scope: App) {
    new SavourApiLambda(scope, Apis.MESSAGE, {
      api: Apis.MESSAGE,
      operation: "hooks",
    });
  }

  private buildUrlShortenerLambdaApis(scope: App) {
    new SavourApiLambda(scope, Apis.URL_SHORTENER, {
      api: Apis.URL_SHORTENER,
      operation: "shortenUrl",
    });
    
    new SavourApiLambda(scope, Apis.URL_SHORTENER, {
      api: Apis.URL_SHORTENER,
      operation: "redirect",
    });
  }
}
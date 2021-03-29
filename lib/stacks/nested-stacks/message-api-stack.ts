import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi, PassthroughBehavior, Cors } from "@aws-cdk/aws-apigateway"
import { Constants } from "../../constants/constants";
import { MappingTemplate } from '@aws-cdk/aws-appsync';
import { StringValue } from "../../constructs/ssm/string-value"

export class MessageApiStack extends SavourApiNestedStack {
  readonly name = "message";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'MessageApi', props);

    const stage = scope.node.tryGetContext('stage');
    const accountSid = StringValue.fromSecureStringParameter(this, 'TwilioAccountSid', `/twilio/accountSid/${stage}`);
    const authToken = StringValue.fromSecureStringParameter(this, 'TwilioAuthToken', `/twilio/authToken/${stage}`);

		const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("message", {       
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS, // this is also the default
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      }
    });

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "hooks",
      memorySize: 512,
      timeout: 60,
      restApi: {
        resource: apiResource.addResource('hooks'),
        httpMethod: HttpMethod.POST,
        lambdaIntegrationOptions: {
          proxy: false,
          requestTemplates: {
            'application/x-www-form-urlencoded':  MappingTemplate.fromFile('./resources/mapping/twilio-request.vtl').renderTemplate()
          },
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
          integrationResponses: [
            {
              statusCode: "200",
              selectionPattern: "",
              responseTemplates: {
                'application/xml': MappingTemplate.fromFile('./resources/mapping/twilio-response.vtl').renderTemplate()
              }
            }
          ]
        }
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "createNumber",
      memorySize: 512,
      timeout: 60,
      environment: {
        accountSid: accountSid,
        authToken: authToken,
        path: '/message/hooks'
      },
      restApi: {
        resource: apiResource.addResource('number'),
        httpMethod: HttpMethod.POST,
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "sendMessage",
      memorySize: 1024,
      timeout: 900,
      environment: {
        accountSid: accountSid,
        authToken: authToken,
        longUrlDomain: Constants.URL.LONG_DOMAIN,
        shortUrlDomain: Constants.URL.SHORT_DOMAIN,
      },
      restApi: {
        resource: apiResource.addResource('send'),
        httpMethod: HttpMethod.POST,
      }
    }));
  }
}
import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi, PassthroughBehavior } from "@aws-cdk/aws-apigateway"
import { Constants } from "../../constants/constants";
import { MappingTemplate } from '@aws-cdk/aws-appsync';
import { StringValue } from "../../constructs/ssm/string-value"

export class MessageApiStack extends SavourApiNestedStack {
  readonly name = "message";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'MessageApi', props);

    const stage = scope.node.tryGetContext('stage');

    const accountSid = StringValue.fromSecureStringParameter(this, 'TwilioAccountSid', '/twilio/accountSid');
    const authToken = StringValue.fromSecureStringParameter(this, 'TwilioAuthToken', '/twilio/authToken');
    const twilioWebhookUrl = StringValue.fromSecureStringParameter(this, 'TwilioWebhook', `/twilio/webhook/${stage}`);

		const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("message");

    //TODO: Remove button API completely
    // this.apiLambdas.push(new SavourApiLambda(this, {
    //   api: this.name,
    //   operation: "button",
    //   environment: {
    //     uuidSize: Constants.UUID_SIZE,
    //     accountSid: accountSid,
    //     authToken: authToken,
    //     longUrlDomain: Constants.LONG_URL_DOMAIN,
    //     shortUrlDomain: Constants.SHORT_URL_DOMAIN,
    //   },
    //   restApi: {
    //     resource: apiResource.addResource('button'),
    //     httpMethod: HttpMethod.POST,
    //   }
    // }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "hooks",
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
      environment: {
        accountSid: accountSid,
        authToken: authToken,
        twilioWebhookUrl: twilioWebhookUrl,
      },
      restApi: {
        resource: apiResource.addResource('number'),
        httpMethod: HttpMethod.POST,
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "sendMessage",
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
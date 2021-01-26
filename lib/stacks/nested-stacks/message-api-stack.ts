import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi, PassthroughBehavior, AuthorizationType } from "@aws-cdk/aws-apigateway"
import { StringParameter }from '@aws-cdk/aws-ssm';
import { Constants } from "../../constants/constants";
import { MappingTemplate } from '@aws-cdk/aws-appsync';

export class MessageApiStack extends SavourApiNestedStack {
  readonly name = "message";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'MessageApiStack', props);

    const accountSid = "temp";/*StringParameter.fromSecureStringParameterAttributes(this, 'SsmAccountSid', {
      parameterName: '/twilio/accountSid',
      version: 1,
    }).stringValue;*/
    const authToken = "temp";/*StringParameter.fromSecureStringParameterAttributes(this, 'SsmAuthToken', {
      parameterName: '/twilio/authToken',
      version: 1,
    }).stringValue;*/
    const twilioWebhookUrl = "temp";/*StringParameter.fromSecureStringParameterAttributes(this, 'SsmTwilioWebhookUrl', {
      parameterName: '/twilio/webhook/dev', //TODO: specify dynamic stage
      version: 1,
    }).stringValue;*/

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
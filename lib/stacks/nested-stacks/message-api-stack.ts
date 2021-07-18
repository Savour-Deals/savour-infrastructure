import { Construct, Duration } from "@aws-cdk/core";
import { Queue } from '@aws-cdk/aws-sqs';
import { RestApi, PassthroughBehavior, Cors } from "@aws-cdk/aws-apigateway"
import { MappingTemplate } from '@aws-cdk/aws-appsync';
import { WaitTime, Wait, TaskInput, StateMachine } from '@aws-cdk/aws-stepfunctions';
import { SqsSendMessage } from '@aws-cdk/aws-stepfunctions-tasks';

import { StringValue } from "../../constructs/ssm/string-value"
import { Constants } from "../../constants/constants";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";

export class MessageApiStack extends SavourApiNestedStack {
  readonly name = "message";
  private accountSid: string;
  private authToken: string;
  private stripeKey: string;

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'MessageApi', props);

    const stage = scope.node.tryGetContext('stage');

    this.stripeKey = StringValue.fromSecureStringParameter(this, 'StripeSecretKey', `/stripe/secretKey/${stage}`);
    this.accountSid = StringValue.fromSecureStringParameter(this, 'TwilioAccountSid', `/twilio/accountSid/${stage}`);
    this.authToken = StringValue.fromSecureStringParameter(this, 'TwilioAuthToken', `/twilio/authToken/${stage}`);

    const campaignStepFunction = this.createCampaignSteps();
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
              responseParameters: {
                'method.response.header.Content-Type': "'application/xml'",
              },
              responseTemplates: {
                'application/xml': MappingTemplate.fromFile('./resources/mapping/twilio-response.vtl').renderTemplate()
              }
            }
          ]
        }
      }
    }, false));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "createNumber",
      memorySize: 512,
      timeout: 60,
      environment: {
        accountSid: this.accountSid,
        authToken: this.authToken,
        path: '/message/hooks'
      },
      restApi: {
        resource: apiResource.addResource('number'),
        httpMethod: HttpMethod.POST,
      }
    }));

    const createCampaignLambda = new SavourApiLambda(this, {
      api: this.name,
      operation: "createCampaign",
      memorySize: 1024,
      timeout: 900,
      environment: {
        campaignStepFunctionArn: campaignStepFunction.stateMachineArn,
      },
      restApi: {
        resource: apiResource.addResource('create'),
        httpMethod: HttpMethod.POST,
      }
    });

    this.apiLambdas.push(createCampaignLambda);
    campaignStepFunction.grantStartExecution(createCampaignLambda.handler);
  }

  createCampaignSteps(): StateMachine {
    const sqsQueue = new Queue(this, `sendMessageQueue`, {
      visibilityTimeout: Duration.seconds(1000) //This must be longer than lambda timeout
    });
    new SavourApiLambda(this, {
      api: this.name,
      operation: "sendMessage",
      memorySize: 1024,
      timeout: 900,
      environment: {
        accountSid: this.accountSid,
        authToken: this.authToken,
        stripeKey: this.stripeKey,
        shortUrlDomain: Constants.URL.SHORT_DOMAIN,
      },
      sqsQueue: sqsQueue
    });

    const waitStep = new Wait(this, "wait_for_campain_date_time", {
      time: WaitTime.timestampPath("$.campaignDateTimeUtc")
    });
    const sqsStep = new SqsSendMessage(this, 'send_execute_campaign_sqs', {
      queue: sqsQueue,
      messageBody: TaskInput.fromDataAt('$.message')
    });
    const definition = waitStep.next(sqsStep);

    return new StateMachine(this, 'ScheduleCampaignStateMachine', {
      definition,
    });
  }
}
import { Constants } from './../../constants/constants';
import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi } from "@aws-cdk/aws-apigateway";
import { StringValue } from '../../constructs/ssm/string-value';

export class PaymentApiStack extends SavourApiNestedStack {
  readonly name = "payment";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'PaymentApi', props);

    const stage = scope.node.tryGetContext('stage');
    const stripeKey = StringValue.fromSecureStringParameter(this, 'StripeSecretKey', `/stripe/secretKey/${stage}`);
  
    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("payment");
    const subscriptionResource = apiResource.addResource("subscription");

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "cancelSubscription",
      environment: {
        stripeKey: stripeKey
      },
      restApi: {
        resource: subscriptionResource,
        httpMethod: HttpMethod.DELETE,
        pathParameter: "place_id"
      }
    }));

    new SavourApiLambda(this, {
      api: this.name,
      operation: "create",
      environment: {
        stripeKey: stripeKey,
        recurringPlanID: Constants.STRIPE.RECURRING_PLAN_ID,
        usagePlanID: Constants.STRIPE.USAGE_PLAN_ID
      },
      restApi: {
        resource: subscriptionResource,
        httpMethod: HttpMethod.POST,
        pathParameter: "place_id"
      }
		});
		
		new SavourApiLambda(this, {
      api: this.name,
      operation: "updateCard",
      environment: {
        stripeKey: stripeKey
      },
      restApi: {
        resource: apiResource.addResource("card"),
        httpMethod: HttpMethod.PUT,
        pathParameter: "place_id"
      }
    });

    new SavourApiLambda(this, {
      api: this.name,
      operation: "updateUsage",
      environment: {
        stripeKey: stripeKey
      },
      restApi: {
        resource: apiResource.addResource("usage"),
        httpMethod: HttpMethod.PUT,
        pathParameter: "place_id"
      }
    });
  }
}
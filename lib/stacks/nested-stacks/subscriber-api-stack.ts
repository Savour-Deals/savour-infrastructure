import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { Cors, RestApi } from "@aws-cdk/aws-apigateway";

export class SubscriberApiStack extends SavourApiNestedStack {
  readonly name = "subscriber";

	constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'SubscriberApi', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("subscriber", {       
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS, // this is also the default
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      }
    });

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "update",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.PUT,
        pathParameter: "mobileNumber"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "get",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.GET,
        pathParameter: "mobileNumber"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "delete",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.DELETE,
        pathParameter: "mobileNumber"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "create",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.POST,
      }
    }));
  }
}
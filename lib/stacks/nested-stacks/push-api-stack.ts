import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { Cors, RestApi } from "@aws-cdk/aws-apigateway";

export class PushApiStack extends SavourApiNestedStack {
  readonly name = "push";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'PushApi', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("push", {       
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS, // this is also the default
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      }
    });

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "getAll",
      restApi: {
        resource: apiResource.addResource('q', {
          defaultCorsPreflightOptions: {
            allowOrigins: Cors.ALL_ORIGINS,
            allowMethods: Cors.ALL_METHODS, // this is also the default
            allowHeaders: Cors.DEFAULT_HEADERS,
            allowCredentials: true
          },
        }),
        httpMethod: HttpMethod.GET,
        pathParameter: "id"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "get",
      restApi: {
        resource: apiResource.addResource('g', {
          defaultCorsPreflightOptions: {
            allowOrigins: Cors.ALL_ORIGINS,
            allowMethods: Cors.ALL_METHODS, // this is also the default
            allowHeaders: Cors.DEFAULT_HEADERS,
            allowCredentials: true
          },
        }),
        httpMethod: HttpMethod.GET,
        pathParameter: "id"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "delete",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.DELETE,
        pathParameter: "id"
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
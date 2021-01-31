import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi } from "@aws-cdk/aws-apigateway";

export class BusinessApiStack extends SavourApiNestedStack {
  readonly name = "business";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'BusinessApiStack', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("business");

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "update",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.PUT,
        pathParameter: "place_id"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "get",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.GET,
        pathParameter: "place_id"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "delete",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.DELETE,
        pathParameter: "place_id"
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
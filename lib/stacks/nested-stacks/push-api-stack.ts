import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi } from "@aws-cdk/aws-apigateway";

export class PushApiStack extends SavourApiNestedStack {
  readonly name = "push";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'PushApi', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("push");

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "getAll",
      restApi: {
        resource: apiResource.addResource('q'),
        httpMethod: HttpMethod.GET,
        pathParameter: "btn_id"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "get",
      restApi: {
        resource: apiResource.addResource('g'),
        httpMethod: HttpMethod.GET,
        pathParameter: "uid"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "delete",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.DELETE,
        pathParameter: "uid"
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
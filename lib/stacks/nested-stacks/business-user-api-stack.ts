import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi } from "@aws-cdk/aws-apigateway";

export class BusinessUserApiStack extends SavourApiNestedStack {
  readonly name = "businessUser";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'BusinessUserApiStack', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("business_user");

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "update",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.PUT,
        pathParameter: "uid"
      }
    }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "get",
      restApi: {
        resource: apiResource,
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
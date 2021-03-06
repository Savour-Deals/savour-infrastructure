import { Construct } from "@aws-cdk/core";
import { SavourApiLambda } from "../../constructs/lambda/savour-api-lambda";
import { HttpMethod, SavourApiNestedStack, SavourApiNestedStackProps } from "../../constructs/nested-stack/api-nested-stack";
import { RestApi, PassthroughBehavior, Cors } from "@aws-cdk/aws-apigateway";

export class UrlApiStack extends SavourApiNestedStack {
  readonly name = "url";

  constructor(scope: Construct, props: SavourApiNestedStackProps) {
    super(scope, 'UrlApi', props);

    const api = RestApi.fromRestApiAttributes(this, 'RestApi', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    const apiResource = api.root.addResource("u", {       
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS, // this is also the default
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowCredentials: true
      }
    });

    // this.apiLambdas.push(new SavourApiLambda(this, {
    //   api: this.name,
    //   operation: "shorten",
    //   restApi: {
    //     resource: apiResource,
    //     httpMethod: HttpMethod.POST,
    //   }
    // }));

    this.apiLambdas.push(new SavourApiLambda(this, {
      api: this.name,
      operation: "redirect",
      restApi: {
        resource: apiResource,
        httpMethod: HttpMethod.GET,
        pathParameter: "shortid",
        lambdaIntegrationOptions: {
          proxy: false,
          requestTemplates: {
            'application/json':  JSON.stringify({ token:  "$input.params('shortid')" })
          },
          passthroughBehavior: PassthroughBehavior.WHEN_NO_TEMPLATES,
          integrationResponses: [
            {
              statusCode: "301",
              responseTemplates: {
                'text/html': "$input.path('$.content')"
              },
              responseParameters: {
                'method.response.header.Content-Type': "'text/html'",
                'method.response.header.Cache-Control': "'private, max-age=90'",
                'method.response.header.Location': "integration.response.body.destination_url"
              }
            },
            {
              statusCode: "404",
              selectionPattern: ".*Not Found.*",
              responseTemplates: {
                'text/html': "$input.path('$.content')"
              },
              responseParameters: {
                'method.response.header.Content-Type': "'text/html'"
              }
            }
          ],
        }
      }
    }, false));
  }
}
import { NestedStack, Construct, NestedStackProps } from "@aws-cdk/core";
import { SavourApiLambda } from "../lambda/savour-api-lambda";

export enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE"
}
export interface SavourApiNestedStackProps extends NestedStackProps {
  readonly restApiId: string;
  readonly rootResourceId: string;
}

export class SavourApiNestedStack extends NestedStack {
	public readonly apiLambdas: SavourApiLambda[] = [];

  constructor(scope: Construct, id: string, props: SavourApiNestedStackProps) {
    super(scope, id, props);
  }
}
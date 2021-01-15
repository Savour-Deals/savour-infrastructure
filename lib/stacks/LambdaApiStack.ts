import * as sst from "@serverless-stack/resources";

export default class DynamoDBStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope, id, props);
    
    const app: any = this.node.root;

		const handler = new lambda.Function(this, "", {
			runtime: lambda.Runtime.NODEJS_10_X,
			code: lambda.Code.fromAsset(""),
			handler: "handler"
		});
  }
}
import * as sst from "@serverless-stack/resources";

export default class SavourDashboardStack extends sst.Stack {
  constructor(scope: sst.App, id: string, props?: sst.StackProps) {
    super(scope,id,props)
  }
}

function createStack(app: sst.App, environment: string) : sst.Stack {
  return new SavourDashboardStack(app, environment);
}
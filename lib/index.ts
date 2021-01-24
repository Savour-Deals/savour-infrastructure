import { App } from "@serverless-stack/resources";
import SavourDashboardStack from "./stacks/SavourDashboardStack";

export default function main(app: App): void {
	new SavourDashboardStack(app, "savour-dashboard");
}
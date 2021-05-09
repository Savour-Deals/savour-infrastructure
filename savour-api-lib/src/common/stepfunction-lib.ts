import { AWSError, StepFunctions } from "aws-sdk";
import { StartExecutionOutput } from "aws-sdk/clients/stepfunctions";
import { PromiseResult } from "aws-sdk/lib/request";

const stepFunctions = new StepFunctions();

export function execute(stepFunctionArn: string, input: any): Promise<PromiseResult<StartExecutionOutput, AWSError>>  {
	return stepFunctions.startExecution({
		stateMachineArn: stepFunctionArn,
		input: JSON.stringify(input),
	}).promise();
}
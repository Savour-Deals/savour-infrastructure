import { SSM } from 'aws-sdk';
const ssm = new SSM();

export function getSSMParameter(params: SSM.GetParameterRequest): Promise<string> {
	return ssm.getParameter(params)
	.promise()
	.then((result) => result.Parameter.Value);
}
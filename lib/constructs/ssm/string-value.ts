import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from '@aws-cdk/custom-resources';

import { Construct } from "@aws-cdk/core";

export class StringValue extends Construct {

  static fromSecureStringParameter(scope: Construct, id: string, name: string): string {
		const getParameter = new AwsCustomResource(scope, `${id}GetParameter`, {
			onUpdate: {
				service: 'SSM',
				action: 'getParameter',
				parameters: {
					Name: name,
					WithDecryption: true
				},
				physicalResourceId: PhysicalResourceId.of(Date.now().toString()) 
			},
			policy: AwsCustomResourcePolicy.fromSdkCalls({resources: AwsCustomResourcePolicy.ANY_RESOURCE})
		});
	
		return getParameter.getResponseField('Parameter.Value');
	}
}
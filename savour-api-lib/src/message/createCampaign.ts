import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from 'uuid';

import { success, failure } from "../common/response-lib";
import * as stepFunctions from "../common/stepfunction-lib";

import pushDao from "src/dao/pushDao";
import Campaign from 'src/model/campaign';

const stepFunctionArn: string = process.env.campaignStepFunctionArn;

interface CreateCampaignRequest {
	campaignName: string,
	message: string,
	link: string,
	businessId: string,
	campaignDateTimeUtc: string
}

export default async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
	console.log(event);
	const request: CreateCampaignRequest = JSON.parse(event.body);
	const campaignId = uuidv4();
	const now = new Date().toISOString();

	const auditRecord: Campaign = {
		id: campaignId,
		campaignName: request.campaignName,
		campaignStatus: "SCHEDULED",
		businessId: request.businessId,
		message: request.message,
		link: request.link,
		campaignDateTimeUtc: request.campaignDateTimeUtc,
		createdDateTimeUtc: now,
		lastUpdatedDateTimeUtc: now
	}

	return messageAudit(auditRecord).then(() => stepFunctions.execute(stepFunctionArn, {
		message: JSON.stringify({
			campaignId: campaignId
		}),
		campaignDateTimeUtc: request.campaignDateTimeUtc
	})).then(() =>  success({
		campaign: auditRecord
	})).catch((e) => {
		console.log(e);
		return messageAudit({
			...auditRecord,
			campaignStatus: "SCHEDULING_FAILED",
			lastUpdatedDateTimeUtc: new Date().toISOString()
		}).then(() => failure({ 
			status: false,
			error: "An error occured scheduling the campaign." 
		}));	
	});

}

function messageAudit(newItem: Campaign): Promise<Campaign> {
	return pushDao.create(newItem)
	.then((result) => result)
	.catch((e) => {
		console.log(e);
		//eat this error, the message campaign was already created. This is just not ideal for data post processing
		return newItem;
	});
}

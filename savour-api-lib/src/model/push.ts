export default interface PushItem {
	id: string,
	campaignStatus: string,
	businessId: string,
	message: string,
	link?: string,
	campaignDateTimeUtc: string
	createdDateTimeUtc: string,
	lastUpdatedDateTimeUtc: string,
	twilioResponse?: any[],
}
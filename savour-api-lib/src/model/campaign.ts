export default interface Campaign {
	id: string,
	campaignStatus: string,
	campaignName: string,
	businessId: string,
	message: string,
	link?: string,
	campaignDateTimeUtc: string
	createdDateTimeUtc: string,
	lastUpdatedDateTimeUtc: string,
	twilioResponse?: any[],
}
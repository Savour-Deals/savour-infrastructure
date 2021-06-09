import redirectDao from "src/dao/redirectDao";

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const tokenSize: number = parseInt(process.env.tokenSize);

function randomString(length: number): string {
	let result = '';
	for (let i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
	return result;
}

export default async function main(longUrl: string, shortUrlDomain: string): Promise<string> {
	if (!longUrl) return;
	
	
	let attempt = 0;
	while (attempt < 5) {
		attempt++;
		const token = randomString(tokenSize);
		const shortUrl = `${shortUrlDomain}/${token}`;
		try {
			await redirectDao.create({
				id: token,
				destinationUrl: longUrl,
				shortUrl: shortUrl
			});
			return shortUrl;
		} catch (e) {
			console.log(e);
		}
	}
}
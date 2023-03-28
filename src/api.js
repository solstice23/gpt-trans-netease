import { getSetting, setSetting } from './utils.js';


// from https://github.com/ztjhz/chatgpt-free-app
const url = 'https://api.openai.com/v1/chat/completions';
const getChatCompletionStreamCustomAPI = async (apiKey, messages, config = {presence_penalty: 0, temperature: 1}) => {
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: getSetting('model', 'gpt-3.5-turbo'),
			messages,
			...config,
			stream: true
		})
	});
	if (!response.ok) {
		throw new Error(await response.text());
	}
	const stream = response.body;
	return stream;
}
const getChatCompletionStreamPublicEndpoint = async (endpoint, messages, config = {presence_penalty: 0, temperature: 1}) => {
	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: getSetting('model', 'gpt-3.5-turbo'),
			messages,
			...config,
			stream: true
		}),
	});
	if (response.status === 404 || response.status === 405) {
		throw new Error(
			'无效的 Public API Endpoint, 请检查其是否正确设置或失效'
		);
	}

	const text = await response.text();
	if (response.status === 429 && text.includes('insufficient_quota'))
		throw new Error(
			'Public API Endpoint 调用次数已达上限, 请更换或使用自己的 API Key\n' + text
		);
	if (!response.ok) throw new Error(text);

	const stream = response.body;
	return stream;
};

export const getChatCompletionStream = async (messages, config = {presence_penalty: 0, temperature: 1}) => {
	if (getSetting('api-type', 'public') == 'public') {
		const endpoint = getSetting('public-api-endpoint', 'https://chatgpt-api.shn.hk/v1/');
		console.log('using public api', endpoint);

		try {
			new URL(endpoint);
		} catch (e) {
			throw new Error('Public API Endpoint 不是一个正确的 URL, 请前往设置中检查');
		}

		return getChatCompletionStreamPublicEndpoint(endpoint, messages, config);
	} else {
		console.log('using custom api key');
		return getChatCompletionStreamCustomAPI(getSetting('api-key', ''), messages, config);
	}
}
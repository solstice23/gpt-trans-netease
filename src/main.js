import './style.scss'
import { initUI } from './ui.js'
import { getChatCompletionStream } from './api.js'
import { Settings } from './settings.js'
import { createRoot } from 'react-dom/client'

const parseEventSource = (data) => {
	const result = data
		.split('\n\n')
		.filter(Boolean)
		.map((chunk) => {
			const jsonString = chunk
				.split('\n')
				.map((line) => line.replace(/^data: /, ''))
				.join('');
			if (jsonString === '[DONE]') return jsonString;
			try {
				const json = JSON.parse(jsonString);
				return json;
			} catch {
				return '[ERROR]';
			}
		});
	return result;
};

const getGPTTranslation = async (originalLyrics, onStream, onDone) => {
	const encodedLyrics = originalLyrics.map((x, i) => `${i+1}. ${x.trim()}`).join('\n');
	//console.log('encodedLyrics', encodedLyrics);
	const stream = await getChatCompletionStream([
		//{ content: "You are ChatGPT, a large language model trained by OpenAI.\nKnowledge cutoff: 2021-09\nCurrent date: 2023-03-08", role: "system"},
		{ content: `Translate the following lyrics into Simplified Chinese:\n${encodedLyrics}`, role: "user"}
	]);
	const reader = stream.getReader();
	while (true) {
		const {done, value} = await reader.read();
		const result = parseEventSource(new TextDecoder().decode(value));
		if (result === '[DONE]' || done) {
			break;
		}
		const resultString = result.reduce((output, cur) => {
			if (typeof(cur) === 'string'){
				return output;
			} else {
				const content = cur.choices[0].delta.content;
				if (content) output += content;
				return output;
			}
		}, '');
		//console.log(resultString);
		onStream(resultString);
	}
	onDone();
}
const getLocalGPTTranslation = async (lyrics, onStream, onDone) => {
	onStream(lyrics);
	onDone();
}

const simulateGPTTranslation = async (originalLyrics, onStream, onDone) => {
	let lastTime = Date.now(), cnt = 0;
	const interval = setInterval(() => {
		const resultString = cnt % 5 === 0 ? '\n' : '测试翻译';
		onStream(resultString);
		cnt++;
		if (cnt > 60) {
			clearInterval(interval);
			onDone();
		}
	}, 300);
}

const shouldTranslate = (originalLyrics) => {
	const hasChinese = originalLyrics.some((x) => /[\u4e00-\u9fa5]/.test(x));
	const hasJapanese = originalLyrics.some((x) => /[\u3040-\u30ff]/.test(x));
	const hasKorean = originalLyrics.some((x) => /[\uac00-\ud7a3]/.test(x));
	const hasEnglish = originalLyrics.some((x) => /[a-zA-Z]/.test(x));
	if (hasChinese) {
		return (hasJapanese || hasKorean);
	} else {
		return (hasEnglish || hasJapanese || hasKorean);
	}
}

const onLyricsUpdate = async (e) => {
	document.body.classList.remove('can-genereate-gpt-translation');
	if (!e.detail) {
		return;
	}
	if (e.detail.amend) {
		return;
	}
	if (e.detail.lyrics.some((x) => x.translatedLyric)) {
		return;
	}
	let originalLyrics = [], mapping = [];
	for (let index in e.detail.lyrics) {
		const line = e.detail.lyrics[index];
		if (!line?.originalLyric?.trim()) continue;
		if (/^作.+[:：]/.test(line.originalLyric.trim())) continue;
		if (/^编曲[:：]/.test(line.originalLyric.trim())) continue;

		originalLyrics.push(line.originalLyric.trim());
		mapping.push(index);
	}
	if (!originalLyrics.length) {
		return;
	}
	if (!shouldTranslate(originalLyrics)) {
		return;
	}

	const hash = e.detail.hash;
	const taskID = +new Date();
	const songID = betterncm.ncm.getPlaying().id;
	const songName = betterncm.ncm.getPlaying().title;
	const lyrics = e.detail.lyrics;

	const localLyrics = await getLocalLyrics(hash);
	//console.log('local', localLyrics);

	let curIndex = 0;
	let buffer = '\n', fullGPTResponse = '';
	const onStream = (resultString) => {
		for (let char of resultString) {
			fullGPTResponse += char;
			if (char === '\n') {
				buffer = '';
				if (lyrics[mapping[curIndex]]?.translatedLyric) curIndex++;
				document.dispatchEvent(new CustomEvent('gpt-task-progress', { detail: { taskID, progress: curIndex / mapping.length * 100 }}));
			}
			buffer += char;
			if (buffer[0] === '\n') {
				if (/^\n\d+\./.test(buffer)) {
					buffer = '';
				}
			} else {
				if (mapping[curIndex] && lyrics[mapping[curIndex]]) {
					lyrics[mapping[curIndex]].translatedLyric = ((lyrics[mapping[curIndex]].translatedLyric ?? '') + char).trim();
				}
			}
		}
		if (window.currentLyrics?.hash === hash) {
			window.currentLyrics.lyrics = lyrics;
			window.currentLyrics.amend = true;
			window.currentLyrics.contributors.translation = { name: 'ChatGPT' }
			document.dispatchEvent(new CustomEvent('lyrics-updated', {detail: window.currentLyrics}));
		}
		//console.log(fullGPTResponse);
	}
	const onDone = async () => {
		//console.log('done');
		if (!localLyrics) {
			await saveLocalLyrics(hash, fullGPTResponse);
		}
		document.dispatchEvent(new CustomEvent('gpt-task-done', { detail: { taskID }}));
	}
	if (localLyrics) {
		await getLocalGPTTranslation(localLyrics, onStream, onDone);
		return;
	}
	document.body.classList.add('can-genereate-gpt-translation');
	window.generateGPTTranslation = async () => {
		window.generateGPTTranslation = null;
		document.body.classList.remove('can-genereate-gpt-translation');
		document.dispatchEvent(new CustomEvent('gpt-new-task', { detail: { taskID, songID, songName }}));
		try {
			await getGPTTranslation(originalLyrics, onStream, onDone);
		} catch (error) {
			if (window.currentLyrics?.hash === hash) {
				window.currentLyrics.lyrics = window.currentLyrics.lyrics.map((x) => {
					delete x.translatedLyric;
					return x;
				});
				window.currentLyrics.amend = false;
				document.dispatchEvent(new CustomEvent('lyrics-updated', { detail: window.currentLyrics }));
			}
			console.error(error);
			const msg = error.message;
			if (msg.startsWith('{')) {
				const json = JSON.parse(msg);
				if (json?.error?.code == 'invalid_api_key') {
					document.dispatchEvent(new CustomEvent('gpt-task-error', { detail: { taskID, error: 'API Key 无效'}}));
					return;
				}
				if (json?.error?.message) {
					document.dispatchEvent(new CustomEvent('gpt-task-error', { detail: { taskID, error: json.error.message}}));
					return;
				}
			}
			document.dispatchEvent(new CustomEvent('gpt-task-error', { detail: { taskID, error: error.message }}));
		}
	}
	//await simulateGPTTranslation(originalLyrics, onStream, onDone);
};

const saveLocalLyrics = async (hash, lyrics) => {
	await betterncm.fs.mkdir('gpt-translated-lyrics');
	await betterncm.fs.writeFile(`gpt-translated-lyrics/${hash}.txt`, 
		new Blob([lyrics], {
			type: 'text/plain'
		})
	);
}
const getLocalLyrics = async (hash) => {
	if (await betterncm.fs.exists(`gpt-translated-lyrics/${hash}.txt`)) {
		return await new Response(
			await betterncm.fs.readFile(`gpt-translated-lyrics/${hash}.txt`)
		).text();
	} else {
		return null;
	}
}


document.addEventListener('lyrics-updated', onLyricsUpdate);
if (window.currentLyrics) {
	onLyricsUpdate({detail: window.currentLyrics});
}

plugin.onLoad(() => {
	initUI();
});

plugin.onConfig((tools) => {
	const div = document.createElement('div');
	const divRoot = createRoot(div);
	divRoot.render(<Settings />);

	return div;
});
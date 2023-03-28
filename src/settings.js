import { getSetting, setSetting } from './utils.js';

import * as React from 'react';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const useState = React.useState;
const useEffect = React.useEffect;
const useLayoutEffect = React.useLayoutEffect;
const useMemo = React.useMemo;
const useCallback = React.useCallback;
const useRef = React.useRef;

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
});
const lightTheme = createTheme({
	palette: {
		mode: 'light',
	},
});
const themes = {
	dark: darkTheme,
	light: lightTheme,
};

export function Settings(props) {
	const [theme, setTheme] = useState(document.body.classList.contains('ncm-light-theme') ? 'light' : 'dark');

	useEffect(() => {
		new MutationObserver(() => {
			if (document.body.classList.contains('ncm-light-theme')) {
				setTheme('light');
			} else {
				setTheme('dark');
			}
		}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
	}, []);

	const [ model, setModel ] = useState(getSetting('model', 'gpt-3.5-turbo'));
	const [ apiType, setApiType ] = useState(getSetting('api-type', 'public'));
	const [ apiEndpoint, setApiEndpoint ] = useState(getSetting('public-api-endpoint', 'https://chatgpt-api.shn.hk/v1/'));
	const [ apiKey, setApiKey ] = useState(getSetting('api-key', ''));

	return (
		<ThemeProvider theme={themes[theme]}>
			<div className='lyric-bar-settings' style={{padding: '15px'}}>
				<Stack direction="column" spacing={2}>
					<Typography gutterBottom>在没有中文翻译的歌词界面，点击右侧栏的 GPT 小图标以开始翻译</Typography>
					<FormGroup>					
						<Stack direction="column" spacing={2} alignItems="flex-start">
							<FormControl fullWidth>
								<InputLabel id="gpt-model">模型</InputLabel>
								<Select
									labelId="gpt-model"
									defaultValue={model}
									label="模型"
									onChange={(e) => {
										setModel(e.target.value);
										console.log(e.target.value);
										setSetting('model', e.target.value);
									}}
								>
									<MenuItem value={'gpt-3.5-turbo'}>GPT-3.5-turbo</MenuItem>
									<MenuItem value={'gpt-4'}>GPT-4</MenuItem>
								</Select>
							</FormControl>
							<FormControl style={{ width: 'fit-content' }}>
								<FormLabel>API</FormLabel>
								<RadioGroup	row defaultValue={getSetting('api-type', 'public')} onChange={(e) => {
									setApiType(e.target.value);
									setSetting('api-type', e.target.value);
								}}>
									<FormControlLabel value="public" control={<Radio />} label="Public API Endpoint" />
									<FormControlLabel value="custom" control={<Radio />} label="API Key" />
								</RadioGroup>
							</FormControl>
							
							{
								apiType === 'public' &&
									<TextField
										label="Public API Endpoint URL"
										fullWidth
										variant="filled"
										defaultValue={getSetting('public-api-endpoint', 'https://chatgpt-api.shn.hk/v1/')}
										onChange={(e) => {
											setApiEndpoint(e.target.value);
											setSetting('public-api-endpoint', e.target.value);
										}}
										error={
											!apiEndpoint.startsWith('https://') &&
											!apiEndpoint.startsWith('http://')
										}
									/>
							}
							{
								apiType === 'custom' &&
									<TextField
										label="API Key"
										fullWidth
										variant="filled"
										defaultValue={getSetting('api-key', '')}
										onChange={(e) => {
											setApiKey(e.target.value);
											setSetting('api-key', e.target.value);
										}}
										error={!/^sk-[0-9A-Za-z]{48}$/.test(apiKey)}
									/>
							}

							
							<Button variant="outlined" onClick={async () => {
								await betterncm.fs.mkdir('gpt-translated-lyrics');
								await betterncm.app.exec(
									`explorer "${await betterncm.app.getDataPath()}\\gpt-translated-lyrics"`,
									false,
									true,
								);
							}}>打开缓存目录</Button>
						</Stack>
					</FormGroup>
				</Stack>
			</div>
		</ThemeProvider>
	);
}

import { Flipper, Flipped } from 'react-flip-toolkit'

const useEffect = React.useEffect;

function UI(props) {
	const [tasks, setTasks] = React.useState([]);

	useEffect(() => {
		document.addEventListener('gpt-new-task', (e) => {
			setTasks((tasks) => {
				return [...tasks, {
					status: 'pending',
					taskID: e.detail.taskID,
					hash: e.detail.hash,
					songID: e.detail.songID,
					songName: e.detail.songName
				}];
			});
		});
	}, []);

	useEffect(() => {
		document.addEventListener('gpt-task-done', (e) => {
			setTasks((tasks) => {
				const task = tasks.find((task) => task.taskID === e.detail.taskID);
				if (task) {
					task.status = 'done';
				}
				return [...tasks];
			});
			setTimeout(() => {
				setTasks((tasks) => {
					return tasks.filter((task) => task.taskID !== e.detail.taskID);
				});
			}, 1500);
		});
	}, []);

	useEffect(() => {
		document.addEventListener('gpt-remove-task', (e) => {
			setTasks((tasks) => {
				return tasks.filter((task) => task.taskID !== e.detail);
			});
		});
	}, []);

	useEffect(() => {
		document.addEventListener('gpt-task-error', (e) => {
			setTasks((tasks) => {
				const task = tasks.find((task) => task.taskID === e.detail.taskID);
				if (task) {
					task.status = 'error';
					task.error = e.detail.error;
				}
				return [...tasks];
			});
		});
	}, []);

	useEffect(() => {
		document.addEventListener('gpt-task-progress', (e) => {
			setTasks((tasks) => {
				const task = tasks.find((task) => task.taskID === e.detail.taskID);
				if (task) {
					task.status = 'progress';
					task.progress = e.detail.progress;
				}
				return [...tasks];
			});
		});
	}, []);

	return (
		<div className="gpt-task-ui">
			<Flipper flipKey={tasks.map((task) => task.taskID).join('')}>
				{tasks.map((task) => {
					return (
						<Flipped flipId={task.taskID} key={task.taskID}>
							<div className="gpt-task-ui-item" key={task.taskID}>
								<div className="gpt-task-ui-item-inner">
									<div className="gpt-task-ui-item-logo">
										<svg fill="#fff" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
									</div>
									<div className="gpt-task-ui-item-info">										
										<div className="gpt-task-ui-item-name">
											{task.songName}
										</div>
										<div className="gpt-task-ui-item-status">
											{
												task.status === 'pending' && (
													<span>初始化...</span>
												)
											}
											{
												task.status === 'progress' && (
													<div className="gpt-task-ui-item-status-progress">
														<div className="gpt-task-ui-item-status-progress-inner" style={{width: `${task.progress}%`}}></div>
													</div>
												)
											}
											{
												task.status === 'done' && (
													<span>完成</span>
												)
											}
											{
												task.status === 'error' && (
													<span className="gpt-task-ui-item-status-error">{task.error}</span>
												)
											}
										</div>
									</div>
									<div className="gpt-task-ui-item-close">
										<button className="gpt-task-ui-item-close-button" onClick={() => {
											document.dispatchEvent(new CustomEvent('gpt-remove-task', {detail: task.taskID}));
										}}>
											<svg fill="#fff" viewBox="0 0 24 24" role="img" xmlns="http://www.w3.org/2000/svg"><path d="M12 10.586l4.95-4.95a.75.75 0 0 1 1.06 1.06l-4.95 4.95 4.95 4.95a.75.75 0 0 1-1.06 1.06l-4.95-4.95-4.95 4.95a.75.75 0 0 1-1.06-1.06l4.95-4.95-4.95-4.95a.75.75 0 0 1 1.06-1.06l4.95 4.95z"/></svg>
										</button>
									</div>
								</div>
							</div>
						</Flipped>
					);
				})}
			</Flipper>
		</div>
	);
}
export function initUI() {
	const div = document.createElement('div');
	div.className = 'gpt-task-ui-container';
	document.body.appendChild(div);
	ReactDOM.render(<UI />, div);
}

/*window.gptuitest = () => {
	document.dispatchEvent(new CustomEvent('gpt-new-task', {detail: {
		hash: '123-456',
		songID: '123',
		songName: '歌曲名'
	}}));
	document.dispatchEvent(new CustomEvent('gpt-new-task', {detail: {
		hash: '789-012',
		songID: '233',
		songName: '歌曲名2'
	}}));
	setTimeout(() => {
		document.dispatchEvent(new CustomEvent('gpt-task-done', {detail: {
			hash: '123-456'
		}}));
	}, 1000);

	setInterval(() => {
		document.dispatchEvent(new CustomEvent('gpt-task-progress', {detail: {
			hash: '789-012',
			progress: Math.random() * 100
		}}));
	}, 500);
}*/
import cp from 'child_process';
import rl from 'readline';

export interface ProcessStatusUnix {
	/**
	 * The user that creates the process
	 */
	user: string;

	/**
	 * Process ID
	 */
	pid: number;

	/**
	 * % CPU
	 */
	pcpu: number;

	/**
	 * % Memory
	 */
	pmem: number;

	/**
	 * Virtual Memory
	 */
	vsz: number;

	/**
	 * Reserved Memory
	 */
	rss: number;

	/**
	 * Controlling Terminal
	 */
	tty: string;

	/**
	 * Multi-Character Process State
	 */
	stat: string;

	/**
	 * Time the command started
	 */
	start: string;

	/**
	 * Accumulated cpu time, user + system
	 */
	time: string;

	/**
	 * Command name
	 */
	command: string;
}

export interface CommandOptions {
	/**
	 * Get processes started by specific user(s).
	 * All users are included by default.
	 */
	user?: string;
}

interface LineParserState {
	i: number;
}

function readCell(line: string, state: LineParserState): string {
	let i = state.i;
	while (line.charAt(i) === ' ') {
		i++;
	}
	const end = line.indexOf(' ', i);
	state.i = end + 1;
	return line.substring(i, end);
}

/**
 * Parse process status (Unix).
 * @param log A line of `ps` command output
 * @returns process status
 */
export function parse(log: string): ProcessStatusUnix {
	const state: LineParserState = {
		i: 0,
	};
	const user = readCell(log, state);
	const pid = Number.parseInt(readCell(log, state), 10);
	const pcpu = Number.parseFloat(readCell(log, state));
	const pmem = Number.parseFloat(readCell(log, state));
	const vsz = Number.parseInt(readCell(log, state));
	const rss = Number.parseInt(readCell(log, state));
	const tty = readCell(log, state);
	const stat = readCell(log, state);
	const start = readCell(log, state);
	const time = readCell(log, state);
	const command = log.substring(state.i);
	return {
		user,
		pid,
		pcpu,
		pmem,
		vsz,
		rss,
		tty,
		stat,
		start,
		time,
		command,
	};
}

/**
 * Get processes on Unix.
 * @param options command options
 * @returns process status
 */
export async function ps(options: CommandOptions = {}): Promise<string[]> {
	let flags = 'uxww';
	const args: string[] = [];
	if (options.user) {
		args.push('--user');
		args.push(options.user);
	} else {
		flags += 'a';
	}

	const child = cp.spawn('ps', [flags, '--no-headers', ...args]);
	const input = rl.createInterface({ input: child.stdout });
	return new Promise((resolve, reject) => {
		const status: string[] = [];
		child.once('error', reject);
		input.on('line', (line) => {
			status.push(line);
		});
		input.once('close', () => {
			resolve(status);
		});
	});
}

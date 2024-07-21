import { jest, expect, it } from '@jest/globals';
import cp from 'child_process';
import { PassThrough } from 'stream';

import { parse, ps } from '../src/ProcessStatusUnix.js';

it('should read process statuses from all users', async () => {
	const spawn = jest.spyOn(cp, 'spawn');
	const stdout = new PassThrough();
	spawn.mockReturnValueOnce({
		once: jest.fn(),
		stdout,
	} as unknown as cp.ChildProcessWithoutNullStreams);
	stdout.write('root         963  0.0  0.7 2125912 29888 ?       Ssl  Jun30   8:46 /usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock\n');
	stdout.write('takashiro        1131  0.0  0.0 1238400 2764 ?        Sl   Jun30   5:43 /usr/bin/containerd-shim-runc-v2 -namespace moby -id 7dd282 -address /run/containerd/containerd.sock\n');
	stdout.end();

	const processes = await ps();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('ps', ['uxwwa', '--no-headers']);
	expect(processes).toHaveLength(2);

	const p1 = parse(processes[0]);
	expect(p1).toStrictEqual({
		user: 'root',
		pid: 963,
		pcpu: 0.0,
		pmem: 0.7,
		vsz: 2125912,
		rss: 29888,
		tty: '?',
		stat: 'Ssl',
		start: 'Jun30',
		time: '8:46',
		command: '/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock',
	});

	const p2 = parse(processes[1]);
	expect(p2).toStrictEqual({
		user: 'takashiro',
		pid: 1131,
		pcpu: 0.0,
		pmem: 0.0,
		vsz: 1238400,
		rss: 2764,
		tty: '?',
		stat: 'Sl',
		start: 'Jun30',
		time: '5:43',
		command: '/usr/bin/containerd-shim-runc-v2 -namespace moby -id 7dd282 -address /run/containerd/containerd.sock',
	});
});

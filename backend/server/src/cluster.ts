import cluster, { Worker } from 'cluster';
import os from 'os';

const forkWorkers = (): void => {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}

const handleWorkerExit = (): void => {
  cluster.on('exit', (worker: Worker, code: number, signal: string) => {
    console.log(`Worker ${worker.process.pid} exited with code ${code} and signal ${signal}`);
  });
}

const gracefulShutdown = (): void => {
  process.on('SIGTERM', () => {
    console.log('Master process is shutting down gracefully');
    if (cluster.workers) {
        Object.values(cluster.workers)
            .filter((worker): worker is Worker => worker !== undefined)
            .forEach((worker: Worker) => {
            worker.kill();
            });
    }
  });
}

export const initCluster = (): void => {
    if (cluster.isPrimary) {
        forkWorkers();
        handleWorkerExit();
        gracefulShutdown();
    }
}

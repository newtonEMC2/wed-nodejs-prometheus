const prometheusClient = require('prom-client');

const {
  Counter, Gauge, Histogram, register: defaultRegister, Registry, Summary,
} = prometheusClient;

const defaultOptions = {
  addRouteMetrics: true,
  collectDefaultMetrics: true,
  authorization: null,
};

let metrics = {};
let register = null;

const toSnakeCase = (string) => string.toLowerCase()
  .replace(/[^a-z]+/ig, ' ')
  .trim()
  .replace(/\s/ig, '_');

const getMetric = (type, name, options) => {
  if (!name) {
    throw new Error('The name of the metric is missing');
  }
  const snakeCaseName = toSnakeCase(name);
  const metric = metrics[snakeCaseName];
  if (metric) {
    return metric;
  }
  switch (type) {
    case 'counter':
      metrics[snakeCaseName] = new Counter({
        name: snakeCaseName,
        help: snakeCaseName,
        registers: [register],
        ...(options.labelNames && {
          labelNames: options.labelNames,
        }),
      });
      break;
    case 'gauge':
      metrics[snakeCaseName] = new Gauge({
        name: snakeCaseName,
        help: snakeCaseName,
        registers: [register],
      });
      break;
    case 'histogram':
      metrics[snakeCaseName] = new Histogram({
        name: snakeCaseName,
        help: snakeCaseName,
        registers: [register],
      });
      break;
    case 'summary':
      metrics[snakeCaseName] = new Summary({
        name: snakeCaseName,
        help: snakeCaseName,
        percentiles: [0.1, 0.5, 0.9, 0.99],
        maxAgeSeconds: 600,
        ageBuckets: 5,
        registers: [register],
      });
      break;
    // no default
  }
  return metrics[snakeCaseName];
};

const getGauge = (name, labelNames) => getMetric('gauge', name, { labelNames });

const getCounter = (name, labelNames) => getMetric('counter', name, { labelNames });

const getHistogram = (name) => getMetric('histogram', name);

const getSummary = (name) => getMetric('summary', name);

const initPrometheus = (app, parameterOptions) => {
  if (!app) {
    throw new Error('Missing express express app parameter.');
  }

  const options = { ...defaultOptions, ...parameterOptions };

  defaultRegister.clear();
  register = new Registry();
  metrics = {};

  if (options.collectDefaultMetrics) {
    prometheusClient.collectDefaultMetrics({ register });
  }

  app.get('/metrics', async (_, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.send(await register.metrics());
    } catch (err) {
      res.sendStatus(500);
    }
  });

  if (options.addRouteMetrics) {
    app.use((req, res, next) => {
      req.startTime = Date.now();
      req.on('close', () => {
        const code = `${`${res.statusCode}`[0]}00`;
        const path = `${req.method} ${(req.route && req.route.path) || 'No path'}`;
        const elapsedTime = Date.now() - req.startTime;
        getCounter(`${path} status code`, ['code']).inc({ code });
        getSummary(`${path} response time`).observe(elapsedTime);
      });
      next();
    });
  }
};

module.exports = {
  initPrometheus,
  getCounter,
  getGauge,
  getHistogram,
  getSummary,
};

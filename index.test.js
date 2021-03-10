const express = require('express');
const request = require('supertest');
const {
  getCounter, getGauge, getHistogram, getSummary, initPrometheus,
} = require('./index.js');

const getServer = (options) => {
  const app = express();

  initPrometheus(app, options);

  app.get('/test/:status', (req, res) => {
    res.sendStatus(parseInt(req.params.status, 10));
  });

  return app;
};

describe('initPrometheus()', () => {
  it('should throw an error without the app parameter', () => {
    expect(() => initPrometheus()).toThrow();
  });
  it('should automatically collect metrics from the routes', async () => {
    const app = getServer({ collectDefaultMetrics: false });
    await request(app).get('/test/200');
    const { text } = await request(app)
      .get('/metrics')
      .expect(200);
    expect(text).toContain('get_test_status_response_time');
  });
  describe('options.collectDefaultMetrics', () => {
    it('should add default metrics by default', async () => {
      const app = getServer();
      await request(app).get('/test/200');
      const { text } = await request(app)
        .get('/metrics')
        .expect(200);
      expect(text).toContain('process_cpu_user_seconds_total');
    });
    it('should not add default metrics if the option is set to "false"', async () => {
      const app = getServer({ collectDefaultMetrics: false });
      await request(app).get('/test/200');
      const { text } = await request(app)
        .get('/metrics')
        .expect(200);
      expect(text).not.toContain('process_cpu_user_seconds_total');
    });
  });
  describe('options.authorization', () => {
    it.todo('should respond 200 to /metrics without authorization option');
    it.todo('should respond 501 to /metrics with authorization option without the header');
    it.todo('should respond 200 to /metrics with authorization option with the header');
  });
  describe('options.addRouteMetrics', () => {
    it('should add default metrics by default', async () => {
      const app = getServer();
      await request(app).get('/test/200');
      const { text } = await request(app)
        .get('/metrics')
        .expect(200);
      expect(text).toContain('get_test_status_status_code');
    });
    it('should not collect routes metrics if deactivated', async () => {
      const app = getServer({ addRouteMetrics: false });
      await request(app).get('/test/200');
      const { text } = await request(app)
        .get('/metrics')
        .expect(200);
      expect(text).not.toContain('get_test_status_status_code');
    });
    it('should collect all kind of status codes', async () => {
      const app = getServer();
      await request(app).get('/test/200');
      await request(app).get('/test/201');
      await request(app).get('/test/404');
      await request(app).get('/test/500');
      await request(app).get('/test/501');
      await request(app).get('/test/502');
      const { text } = await request(app)
        .get('/metrics')
        .expect(200);
      expect(text).toContain('get_test_status_status_code{code="200"} 2');
      expect(text).toContain('get_test_status_status_code{code="400"} 1');
      expect(text).toContain('get_test_status_status_code{code="500"} 3');
    });
  });
});

describe('Metrics', () => {
  it('should return a counter object', () => {
    const counter = getCounter('new_counter');
    expect(typeof counter).toEqual('object');
  });
  it('should format the names for prometheus', () => {
    const counter = getCounter('This is my counter');
    expect(typeof counter).toEqual('object');
  });
  it('should format the names for prometheus by removing all special character', async () => {
    const app = getServer({ collectDefaultMetrics: false });
    const counter = getCounter('This i$ -- my counter --');
    counter.inc();
    const { text } = await request(app)
      .get('/metrics')
      .expect(200);
    expect(text).toContain('this_i_my_counter');
  });
  it('should throw an error without name', () => {
    expect(() => getCounter()).toThrow();
    expect(() => getHistogram()).toThrow();
    expect(() => getSummary()).toThrow();
  });
  describe('getCounter', () => {
    it('should return a counter object', () => {
      const counter = getCounter('new_counter');
      expect(typeof counter).toEqual('object');
    });
  });
  describe('getGauge', () => {
    it('should return a gauge object', () => {
      const gauge = getGauge('new_gauge');
      expect(typeof gauge).toEqual('object');
    });
  });
  describe('getHistogram', () => {
    it('should return a counter object', () => {
      const histogram = getHistogram('new_histogram');
      expect(typeof histogram).toEqual('object');
    });
  });
  describe('getSummary', () => {
    it('should return a counter object', () => {
      const summary = getSummary('new_summary');
      expect(typeof summary).toEqual('object');
    });
  });
});

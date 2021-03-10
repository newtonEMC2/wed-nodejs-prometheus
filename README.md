# Node.js Prometheus client with ease &bull; [![Actions Status](https://github.com/weekendesk/wed-nodejs-prometheus/actions/workflows/tests.yml/badge.svg?branch=master)](https://github.com/weekendesk/wed-nodejs-prometheus/actions)

This module allow you to simply expose Node.js metrics, can expose route status code metrics and
give an easy way of expose metrics.

This module is based on the [siimon/prom-client](https://github.com/siimon/prom-client) module.

## Enable the metrics

To activate the metrics, you must call the `initPrometheus` method. This method **require** an
express application:

```js
const express = require('express');
const { initPrometheus } = require('wed-config-nodejs-prometheus');

const app = express();

initPrometheus(app);
```

By doing it, all routes status codes will be gathered with the default Node.js ones.

You can disable routes status codes or default Node.js ones by passing some options on the
initialization :

```js
initPrometheus(app, {
  collectDefaultMetrics: false,
  addRouteMetrics: false,
});
```

## Create metrics

Three metrics are currently available and exposed on the same package:

 - Counter via the `getCounter` method,
 - Gauge via the `getGauge` method,
 - Histogram via the `getHistogram` method,
 - Summary via the `getSummary` method.

Every getter need a name, the name will automatically be cleaned and snake_case formatted to fit the
Prometheus requirements.

```js
const { getCounter, getHistogram, getSummary } = require('wed-config-nodejs-prometheus');

const myCounter = getCounter("This is my counter");
myCounter.inc();
```

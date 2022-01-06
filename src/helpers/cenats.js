/* eslint-disable no-restricted-syntax */
const NATS = require('nats');
const { CloudEvent } = require('cloudevents');

// since there is no cloudevents library for node.js yet, this is a acting as one
module.exports = {
  connection: null,
  url: 'nats://localhost:4222',
  js: null,
  jsm: null,
  subscriptions: [],

  async connect(url) {
    let establishing = false;

    if (!this.connection) {
      establishing = true;
      this.url = url || this.url;
      console.log('⏳ Connecting to NATS Server', this.url);
      this.connection = NATS.connect({ servers: [this.url] });
    }
    try {
      this.connection = await this.connection;
      this.js = this.js || this.connection.jetstream();
      this.jsm = this.jsm || this.connection.jetstreamManager();
      this.js = await this.js;
      this.jsm = await this.jsm;

      // only print to console on initial connection
      if (establishing) console.log('✅ Connected to NATS Server', this.url);
    } catch (error) {
      console.error('❌', error);
    }

    return Promise.all([this.connection, this.js, this.jsm]);
  },

  async close() {
    console.log('⏹ Closing connection to NATS Server.');
    this.subscriptions.map((sub) => sub.unsubscribe());

    return this.connection.drain();
  },

  encodeEvent(evt) {
    return NATS.JSONCodec().encode(evt);
  },

  decodeEvent(evt) {
    return NATS.JSONCodec().decode(evt);
  },

  async publish(cloudEvent) {
    await this.connect();

    if (!cloudEvent.validate()) {
      throw new Error('CloudEvent does not match specification.');
    }

    const encodedCloudEvent = this.encodeEvent(cloudEvent);

    return this.js.publish(cloudEvent.type, encodedCloudEvent, { msgId: cloudEvent.id });
  },

  createConsumerConfig(cfg, seqNr) {
    return {
      durable_name: cfg.durable_name,
      deliver_subject: `inbox.${cfg.durable_name}.${seqNr}`,
      deliver_policy: seqNr ? NATS.DeliverPolicy.StartSequence : NATS.DeliverPolicy.All,
      opt_start_seq: seqNr,
      // opt_start_time: string,
      ack_policy: NATS.AckPolicy.Explicit,
      ack_wait: cfg.ack_wait,
      max_deliver: cfg.max_deliver,
      filter_subject: cfg.filter_subject,
      replay_policy: NATS.ReplayPolicy.Instant,
      // rate_limit_bps: -1,
      // sample_freq: '0%',
      // max_waiting: -1,
      max_ack_pending: cfg.max_ack_pending,
      // idle_heartbeat: -1,
      // flow_control: false,
    };
  },

  checkConfigMatch(cfg, con) {
    return Object.entries(cfg).every(([key, value]) => value === con.config[key]);
  },

  async getConsumerForConfig(cfg) {
    const streamName = await this.jsm.streams.find(cfg.filter_subject);
    // console.log(`Stream "${streamName}" is matching to topic "${cfg.filter_subject}".`);

    let con;

    try {
      con = await this.jsm.consumers.info(streamName, cfg.durable_name);
    } catch (error) {
      console.log(`Consumer "${cfg.durable_name}" not found, creating one.`);
      con = await this.jsm.consumers.add(streamName, this.createConsumerConfig(cfg));
      console.log(`Consumer "${con.name}" was created.`);
    }

    // console.log(`Consumer "${con.name}" is listening on "${con.config.filter_subject}".`);

    if (!this.checkConfigMatch(cfg, con)) {
      console.log(`Configuration of consumer "${con.name}" does not match with desired configuration. Attempting to recreate.`);

      // the 60s timeout
      const timeout = new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error(`Recreating consumer "${cfg.durable_name}" has failed because there are still unacknlowedged messages.`)), 60 * 1000);
      });

      // this limits trying to recreate the consumer to 60 seconds
      con = await Promise.race([
        this.recreateConsumer(cfg, streamName),
        timeout,
      ]);
    }

    return con;
  },

  async recreateConsumer(cfg, streamName) {
    let con = await this.jsm.consumers.info(streamName, cfg.durable_name);

    if (con.num_ack_pending === 0) {
      await this.jsm.consumers.delete(streamName, cfg.durable_name);
      console.log(`Consumer "${cfg.durable_name}" was deleted and will be recreated starting at sequence number ${con.ack_floor.stream_seq + 1}.`);
      con = await this.jsm.consumers.add(streamName, this.createConsumerConfig(cfg, con.ack_floor.stream_seq + 1));
      console.log(`Consumer "${con.name}" was created.`);
    } else {
      console.log(`⏳ Consumer ${con.name} has messages with pending ack. Recreation is delayed.`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      con = await this.recreateConsumer(cfg, streamName);
    }

    return con;
  },

  async subscribe(cfg, callback) {
    const con = await this.getConsumerForConfig(cfg);

    const sub = await this.connection.subscribe(con.config.deliver_subject || `inbox.${cfg.durable_name}`, {
      queue: cfg.durable_name,
      callback: (err, msg) => this.handleEvent(err, msg, callback),
    });

    this.subscriptions.push(sub);
  },

  async handleEvent(err, msg, callback) {
    if (err) {
      console.error('❌', err);
      return;
    }

    msg = NATS.toJsMsg(msg);

    if (!msg) {
      console.log('Processed empty message.');
      return;
    }

    const ce = new CloudEvent(this.decodeEvent(msg.data));

    try {
      msg.working();
      await callback(ce);
      msg.ack();
      console.log(msg.redelivered ? `🔁 #${ce.id} was redelivered.` : `✅ #${ce.id} was processed.`);
    } catch (error) {
      msg.nak();
      console.log(`❌ #${ce.id} could not be processed.`);
    }
  },
};

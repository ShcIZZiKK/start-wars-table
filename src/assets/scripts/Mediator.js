let instance = null;

class Mediator {
  constructor() {
    if (!instance) {
      instance = this;
    }

    this.channels = {};

    // eslint-disable-next-line no-constructor-return
    return instance;
  }

  subscribe(channel, fn) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
    }

    this.channels[channel].push({
      context: this,
      callback: fn,
    });
  }

  unsubscribe(channel) {
    if (!this.channels[channel]) {
      return false;
    }

    delete this.channels[channel];

    return this;
  }

  publish(channel) {
    if (!this.channels[channel]) {
      return false;
    }

    const firstArgument = 1;
    // eslint-disable-next-line prefer-rest-params
    const args = Array.prototype.slice.call(arguments, firstArgument);

    this.channels[channel].forEach((subscription) => {
      subscription.callback.apply(subscription.context, args);
    });

    return this;
  }

  installTo(obj) {
    obj.channels = {};

    obj.publish = this.publish;
    obj.subscribe = this.subscribe;
  }
}

export default Mediator;

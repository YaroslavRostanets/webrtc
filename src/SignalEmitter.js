
const SignalEmitter = function() {
  this.events = {}
};

SignalEmitter.prototype.on = function(event, callback) {
  if (this.events[event]) {
    this.events[event].push(callback);
  } else {
    this.events[event] = [callback]
  }
};

SignalEmitter.prototype.emit = function(event, ...data) {
  if (this.events[event]) {
    this.events[event].forEach( fn => fn(...data));
  }
};

SignalEmitter.prototype.subscribe = async function (key) {
  return fetch('http://localhost:3000/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      key
    })
  })
    .then(res => res.json())
    .then( (res) => {
      if (res.event) {
        this.emit(res.event.event, res.event.data);
      }
      this.subscribe(key);
    });
};

SignalEmitter.prototype.send = async (key, event, data) => {
  let res = await fetch('http://localhost:3000/send', {
    method: 'POST',
    body: JSON.stringify({
      key,
      event,
      data
    })
  });
  return await res.json();
};

export default new SignalEmitter();

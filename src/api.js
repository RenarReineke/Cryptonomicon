const API_KEY =
  "a7da3d017367686b0d01b6cdf2e07a2a8451ca2ea33f6a73555509f470e52e94";

const tickersHandlers = new Map();
console.log(tickersHandlers);
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", e => {
  const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
    e.data
  );
  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }
  const handlers = tickersHandlers.get(currency.toLowerCase()) ?? [];
  handlers.forEach(fn => fn(newPrice));
});

//   ToDO: refactor url SearchParams
// const loadTickers = () => {
//   if (tickersHandlers.size === 0) {
//     return;
//   }

//   fetch(
//     `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${[
//       ...tickersHandlers.keys()
//     ].join(",")}&tsyms=USD&api_key=${API_KEY}`
//   )
//     .then(data => data.json())
//     .then(rowData => {
//       console.log("rowData: ", rowData);
//       const updatedPrices = Object.fromEntries(
//         Object.entries(rowData).map(([key, value]) => [key, value.USD])
//       );
//       Object.entries(updatedPrices).forEach(([currency, newPrice]) => {
//         console.log(tickersHandlers);
//         const handlers = tickersHandlers.get(currency);
//         handlers.forEach(fn => fn(newPrice));
//       });
//     });
// };

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === socket.OPEN) {
    socket.send(stringifiedMessage);
  }

  socket.addEventListener("open", () => socket.send(stringifiedMessage), {
    once: true
  });
}

function subscribeToTickerOnWS(ticker) {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

function unSubscribeFromTickerOnWS(ticker) {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~USD`]
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWS(ticker.toUpperCase());
};

export const unSubscribeFromTicker = ticker => {
  tickersHandlers.delete(ticker) || [];
  unSubscribeFromTickerOnWS(ticker);
};

// setInterval(loadTickers, 5000);

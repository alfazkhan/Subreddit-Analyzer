import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store/index.js";
import { ChakraUIProvider } from "./components/ui-components/provider";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element was not found");
}

ReactDOM.createRoot(rootElement).render(
    <ChakraUIProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </ChakraUIProvider>
);

// if (!import.meta.env.PROD) {
//   const script = document.createElement("script")
//   script.src = "//cdn.jsdelivr.net/npm/eruda"
//   script.onload = () => {
//     window.eruda.init()
//   };
//   document.body.appendChild(script);
// }

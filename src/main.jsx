import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store/index.js";
import { ChakraUIProvider } from "./components/ui-components/provider";

ReactDOM.createRoot(document.getElementById("root")).render(
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

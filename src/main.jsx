import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store/index.js";
import { ChakraUIProvider } from "./components/ui-components/provider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ChakraUIProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </ChakraUIProvider>
  </React.StrictMode>,
);

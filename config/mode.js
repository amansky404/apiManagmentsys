let ROUTE_MODE = "public";

function getMode() {
  return ROUTE_MODE;
}

function setMode(mode) {
  if (mode === "public" || mode === "private") {
    ROUTE_MODE = mode;
  }
  return ROUTE_MODE;
}

function toggleMode() {
  ROUTE_MODE = ROUTE_MODE === "public" ? "private" : "public";
  return ROUTE_MODE;
}

module.exports = {
  getMode,
  setMode,
  toggleMode
};

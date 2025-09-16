export default {
    transform: {},
    extensionsToTreatAsEsm: [".js", ".jsx"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testEnvironment: "jsdom",
};

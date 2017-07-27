import node from "rollup-plugin-node-resolve";

export default {
  plugins: [node({jsnext: true, browser: true, modulesOnly: true})]
};
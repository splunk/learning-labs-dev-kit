'use strict'

console.log(process.env);

class Verifier extends BaseClass {
  constructor(){
      super();
  }

  async execute (){
    if (process.env["TEST_VAR"]=="fail"){
      throw new Error("Failed");
    }
  }
}

module.exports = Verifier;
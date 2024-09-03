const evaluateOperation = require("./util")

class IOElement{
    context : any;
    operation : any;
    value : any;
    type : any;
    __process(){
        if(this.operation) {
            this.value = evaluateOperation(this.context, this.operation);
        }
        return this
    }
    getValue(){
        return this.value;
    }
}

class Input extends IOElement {

    constructor(context : any, config : any,type : any){
        super();
        this.context = context
        this.operation = config.operation
        this.value = config.value
        this.type = type
        this.__process();
    }

}

class Output extends IOElement{
    constructor(value : any) {
        super();
        this.value = value
    }
    getValue(){
        this.__process
        return this.value;
    }
}

export {
    Input, Output
}
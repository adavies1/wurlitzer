export default class ExtendedClass {
    constructor() {
        this.api = {};
    }


    /****************************
     *     Public functions     *
     ****************************/


    /****************************
     *     Private functions     *
     ****************************/
    _getPublicApi() {
        let obj = this;
        let publicFunctions = {};
        let props = [];

        do {
            const l = Object.getOwnPropertyNames(obj)
                .concat(Object.getOwnPropertySymbols(obj).map(s => s.toString()))
                .sort()
                .filter((p, i, arr) =>
                    typeof obj[p] === 'function' &&  //only the methods
                    p !== 'constructor' &&           //not the constructor
                    (i == 0 || p !== arr[i - 1]) &&  //not overriding in obj prototype
                    props.indexOf(p) === -1          //not overridden in a child
                )
            props = props.concat(l)
        }
        while (
            (obj = Object.getPrototypeOf(obj)) &&   //walk-up the prototype chain
            Object.getPrototypeOf(obj)              //not the the Object prototype methods (hasOwnProperty, etc...)
        )

        // Now filter prop names, removing private (start with _)
        props = props.filter(prop => {
            return prop[0] !== '_';
        });

        // Get functions, bind them and then add them to a new object
        props.forEach(prop => {
            publicFunctions[prop] = this[prop].bind(this);
        });

        // Return api, ensuring we include any api from parents
        return Object.assign({}, (this.api || {}), publicFunctions);
    }
}
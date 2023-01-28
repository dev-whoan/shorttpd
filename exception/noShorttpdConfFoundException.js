class NoShorttpdConfFoundException extends Error{
    constructor(message){
        super(message);
        this.name = 'NoShorttpdConfFoundException';
    }    
}

export default NoShorttpdConfFoundException;
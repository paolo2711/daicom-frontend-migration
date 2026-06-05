export default {
    checkCharacterInGeneral(event, allowLetters, allowSpace, allowDigits, allowSymbols){
        let lettersAllowed = false;
        let digitsAllowed = false;
        let symbolsAllowed = false;
        let char = String.fromCharCode(event.keyCode);

        switch (event.key) {
            case " ":
                if (allowSpace){
                    event.target.value = event.target.value.replace(/\s+/g, ' ')
                    return true;
                }
                event.target.value = event.target.value.replace(/\s+/g, '')
                return event.preventDefault();
            default:
                if (allowDigits){
                    if(/\p{Number}/ui.test(char)) digitsAllowed=true
                }
                if (allowSymbols) {
                    if(/^[!@#$%^&*)(+=._-]+$/g.test(char)) symbolsAllowed=true
                }
                if(allowLetters) {
                    if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ]+$/.test(char)) lettersAllowed = true
                }
                if (lettersAllowed && digitsAllowed && symbolsAllowed ||
                    lettersAllowed && digitsAllowed || lettersAllowed && symbolsAllowed ||
                    lettersAllowed ||digitsAllowed || symbolsAllowed
                ) return true;
                else return event.preventDefault();
        }
    },
    checkCharacter(event, allowSpace){
        this.checkCharacterInGeneral(event, true, allowSpace, false, false);
    },
    checkDigits(event, allowSpace){
        this.checkCharacterInGeneral(event,false,  allowSpace, true, false)
    },
    checkCharacterAndDigits(event, allowSpace){
        this.checkCharacterInGeneral(event,true,  allowSpace, true, false)
    },
    checkCharacterDigitsAndSymbols(event, allowSpace){
        this.checkCharacterInGeneral(event,true,  allowSpace, true, true)
    }
}